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

package org.openmetadata.client.interceptors;

import com.fasterxml.jackson.databind.ObjectMapper;
import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CustomRequestInterceptor<K> implements RequestInterceptor {
  @Getter private final Class<K> type;
  final ObjectMapper mapper;

  public CustomRequestInterceptor(ObjectMapper mapper, Class<K> type) {
    this.type = type;
    this.mapper = mapper;
  }

  @Override
  public void apply(RequestTemplate requestTemplate) {
    try {
      LOG.debug("Trying to Convert from generated class to org.openmetadata");
      String body = new String(requestTemplate.body());
      K value = mapper.readValue(body, this.getType());
      requestTemplate.body(mapper.writeValueAsString(value));
    } catch (Exception ex) {
      LOG.error(
          "[CustomInterceptor] Failed in transforming request with exception {}", ex.getMessage());
    }
  }
}
