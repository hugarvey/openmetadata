/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.service.events.subscription;

import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.entity.events.EventSubscription;
import org.openmetadata.schema.type.ChangeEvent;
import org.openmetadata.service.events.EventPubSub;
import org.openmetadata.service.events.EventPublisher;
import org.openmetadata.service.events.errors.RetriableException;
import org.openmetadata.service.resources.events.EventResource.EventList;

@Slf4j
public abstract class AbstractAlertPublisher implements EventPublisher {
  // Backoff timeout in seconds. Delivering events is retried 5 times.
  protected static final int BACKOFF_NORMAL = 0;
  protected static final int BACKOFF_3_SECONDS = 3 * 1000;
  protected static final int BACKOFF_30_SECONDS = 30 * 1000;
  protected static final int BACKOFF_5_MINUTES = 5 * 60 * 1000;
  protected static final int BACKOFF_1_HOUR = 60 * 60 * 1000;
  protected static final int BACKOFF_24_HOUR = 24 * 60 * 60 * 1000;
  protected int currentBackoffTime = BACKOFF_NORMAL;
  protected final List<ChangeEvent> batch = new ArrayList<>();

  protected final EventSubscription eventSubscription;
  private final int batchSize;

  protected AbstractAlertPublisher(EventSubscription eventSub) {
    this.eventSubscription = eventSub;
    this.batchSize = eventSub.getBatchSize();
  }

  @Override
  public void onEvent(EventPubSub.ChangeEventHolder changeEventHolder, long sequence, boolean endOfBatch)
      throws Exception {
    // Ignore events that don't match the webhook event filters
    ChangeEvent changeEvent = changeEventHolder.getEvent();

    // Evaluate Alert Trigger Config
    if (!AlertUtil.shouldTriggerAlert(changeEvent.getEntityType(), eventSubscription.getFilteringRules())) {
      return;
    }

    // Evaluate ChangeEvent Alert Filtering
    if (eventSubscription.getFilteringRules() != null
        && !AlertUtil.evaluateAlertConditions(changeEvent, eventSubscription.getFilteringRules().getRules())) {
      return;
    }

    // Batch until either the batch has ended or batch size has reached the max size
    batch.add(changeEventHolder.getEvent());
    if (!endOfBatch && batch.size() < batchSize) {
      return;
    }

    EventList list = new EventList(batch, null, null, batch.size());
    try {
      publish(list);
      batch.clear();
    } catch (RetriableException ex) {
      setNextBackOff();
      LOG.error("Failed to publish event in batch {} due to {}, will try again in {} ms", list, ex, currentBackoffTime);
      Thread.sleep(currentBackoffTime);
    } catch (Exception e) {
      LOG.error("[AbstractAlertPublisher] error {}", e.getMessage(), e);
    }
  }

  public void setNextBackOff() {
    if (currentBackoffTime == BACKOFF_NORMAL) {
      currentBackoffTime = BACKOFF_3_SECONDS;
    } else if (currentBackoffTime == BACKOFF_3_SECONDS) {
      currentBackoffTime = BACKOFF_30_SECONDS;
    } else if (currentBackoffTime == BACKOFF_30_SECONDS) {
      currentBackoffTime = BACKOFF_5_MINUTES;
    } else if (currentBackoffTime == BACKOFF_5_MINUTES) {
      currentBackoffTime = BACKOFF_1_HOUR;
    } else if (currentBackoffTime == BACKOFF_1_HOUR) {
      currentBackoffTime = BACKOFF_24_HOUR;
    }
  }
}
