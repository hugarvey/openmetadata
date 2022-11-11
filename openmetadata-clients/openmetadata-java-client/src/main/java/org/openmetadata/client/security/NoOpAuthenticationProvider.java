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

package org.openmetadata.client.security;

import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.client.security.interfaces.AuthenticationProvider;
import org.openmetadata.schema.services.connections.metadata.OpenMetadataConnection;

@Slf4j
public class NoOpAuthenticationProvider implements AuthenticationProvider {
  public NoOpAuthenticationProvider() {
    /* Nothing to do */
  }

  @Override
  public AuthenticationProvider create(OpenMetadataConnection iConfig) {
    return new NoOpAuthenticationProvider();
  }

  @Override
  public String authToken() {
    return null;
  }

  @Override
  public String getAccessToken() {
    return "";
  }

  @Override
  public void apply(RequestTemplate requestTemplate) {
    // no-auth we don't apply anything
  }
}
