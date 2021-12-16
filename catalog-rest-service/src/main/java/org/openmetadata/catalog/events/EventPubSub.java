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

package org.openmetadata.catalog.events;

import com.lmax.disruptor.BatchEventProcessor;
import com.lmax.disruptor.EventFactory;
import com.lmax.disruptor.EventHandler;
import com.lmax.disruptor.RingBuffer;
import com.lmax.disruptor.dsl.Disruptor;
import com.lmax.disruptor.util.DaemonThreadFactory;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.openmetadata.catalog.type.ChangeEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Change event PubSub built based on LMAX Disruptor.
 */
public class EventPubSub {
  private static final Logger LOG = LoggerFactory.getLogger(EventPubSub.class);
  private static Disruptor<ChangeEventHolder> disruptor;
  private static ExecutorService executor;
  private static RingBuffer<ChangeEventHolder> ringBuffer;
  private static boolean STARTED = false;

  public static void start() {
    if (!STARTED) {
      disruptor = new Disruptor<>(ChangeEventHolder::new, 1024, DaemonThreadFactory.INSTANCE);
      executor = Executors.newCachedThreadPool(DaemonThreadFactory.INSTANCE);
      ringBuffer = disruptor.start();
      LOG.info("Disruptor started");
      STARTED = true;
    }
  }

  public static void shutdown() throws InterruptedException {
    if (STARTED) {
      disruptor.shutdown();
      disruptor.halt();
      executor.shutdown();
      executor.awaitTermination(5, TimeUnit.SECONDS);
      disruptor = null;
      ringBuffer = null;
      STARTED = false;
      LOG.info("Disruptor stopped");
    }
  }

  public static class ChangeEventHolder {
    private ChangeEvent value;

    public void set(ChangeEvent event) {
      this.value = event;
    }

    public ChangeEvent get() {
      return value;
    }
  }

  public static class ChangeEventFactory implements EventFactory<ChangeEventHolder> {
    public ChangeEventHolder newInstance() {
      return new ChangeEventHolder();
    }
  }

  public static void publish(ChangeEvent event) {
    if (event != null) {
      RingBuffer<ChangeEventHolder> ringBuffer = disruptor.getRingBuffer();
      long sequence = ringBuffer.next();
      ringBuffer.get(sequence).set(event);
      ringBuffer.publish(sequence);
    }
  }

  public static BatchEventProcessor<ChangeEventHolder> addEventHandler(EventHandler<ChangeEventHolder> eventHandler) {
    BatchEventProcessor<ChangeEventHolder> processor =
        new BatchEventProcessor<>(ringBuffer, ringBuffer.newBarrier(), eventHandler);
    ringBuffer.addGatingSequences(processor.getSequence());
    executor.execute(processor);
    LOG.info("Processor added for {}", processor);
    return processor;
  }

  public static void removeProcessor(BatchEventProcessor<ChangeEventHolder> processor) {
    ringBuffer.removeGatingSequence(processor.getSequence());
  }

  public void close() {}
}
