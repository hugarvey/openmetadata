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

package org.openmetadata.catalog.secrets;

import org.openmetadata.catalog.services.connections.metadata.OpenMetadataServerConnection.SecretsManagerProvider;

public class SecretsManagerFactory {

  public static SecretsManager createSecretsManager(SecretsManagerConfiguration config) {
    SecretsManagerProvider secretManager =
        config != null && config.getSecretsManager() != null
            ? config.getSecretsManager()
            : SecretsManagerConfiguration.DEFAULT_SECRET_MANAGER;
    switch (secretManager) {
      case LOCAL:
        return LocalSecretsManager.getInstance();
      case AWS:
        return AWSSecretsManager.getInstance(config);
      default:
        throw new IllegalArgumentException("Not implemented secret manager store: " + secretManager);
    }
  }
}
