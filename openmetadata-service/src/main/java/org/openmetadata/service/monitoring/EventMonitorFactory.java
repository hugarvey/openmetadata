/*
 *  Copyright 2022 Collate
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
package org.openmetadata.service.monitoring;

import com.google.common.annotations.VisibleForTesting;
import lombok.Getter;
import org.openmetadata.schema.monitoring.EventMonitorProvider;

public class EventMonitorFactory {

  @Getter private static EventMonitor eventMonitor;

  public static EventMonitor createEventMonitor(EventMonitorConfiguration config, String clusterName) {
    if (eventMonitor != null) {
      return eventMonitor;
    }
    EventMonitorProvider eventMonitorProvider = config != null ? config.getEventMonitor() : null;

    if (eventMonitorProvider == EventMonitorProvider.CLOUDWATCH) {
      eventMonitor = new CloudwatchEventMonitor(eventMonitorProvider, config, clusterName);
    } else {
      throw new IllegalArgumentException("Not implemented Event monitor: " + eventMonitorProvider);
    }

    return eventMonitor;
  }

  @VisibleForTesting
  public static void setEventMonitor(EventMonitor eventMonitor) {
    EventMonitorFactory.eventMonitor = eventMonitor;
  }
}
