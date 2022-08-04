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

import static java.util.Objects.isNull;

import com.google.common.base.CaseFormat;
import java.util.List;
import lombok.Getter;
import org.openmetadata.catalog.airflow.AirflowConfiguration;
import org.openmetadata.catalog.airflow.AuthConfiguration;
import org.openmetadata.catalog.entity.services.ServiceType;
import org.openmetadata.catalog.exception.SecretsManagerException;
import org.openmetadata.catalog.services.connections.metadata.OpenMetadataServerConnection;

public abstract class SecretsManager {

  public static final String OPENMETADATA_PREFIX = "openmetadata";

  @Getter private final OpenMetadataServerConnection.SecretsManagerProvider secretsManagerProvider;

  protected SecretsManager(OpenMetadataServerConnection.SecretsManagerProvider secretsManagerProvider) {
    this.secretsManagerProvider = secretsManagerProvider;
  }

  public boolean isLocal() {
    return false;
  }

  public abstract Object encryptOrDecryptServiceConnectionConfig(
      Object connectionConfig, String connectionType, String connectionName, ServiceType serviceType, boolean encrypt);

  public OpenMetadataServerConnection decryptServerConnection(AirflowConfiguration airflowConfiguration) {
    OpenMetadataServerConnection.AuthProvider authProvider =
        OpenMetadataServerConnection.AuthProvider.fromValue(airflowConfiguration.getAuthProvider());
    String openMetadataURL = airflowConfiguration.getMetadataApiEndpoint();
    return new OpenMetadataServerConnection()
        .withAuthProvider(authProvider)
        .withHostPort(openMetadataURL)
        .withSecurityConfig(decryptAuthProviderConfig(authProvider, airflowConfiguration.getAuthConfig()));
  }

  public abstract AirflowConfiguration encryptAirflowConnection(AirflowConfiguration airflowConfiguration);

  protected abstract Object decryptAuthProviderConfig(
      OpenMetadataServerConnection.AuthProvider authProvider, AuthConfiguration authConfig);

  protected String buildSecretId(String... suffixes) {
    StringBuilder format = new StringBuilder();
    format.append(OPENMETADATA_PREFIX);
    for (String suffix : List.of(suffixes)) {
      if (isNull(suffix)) {
        throw new SecretsManagerException("Cannot build a secret id with null values.");
      }
      format.append("-%s");
    }
    return String.format(format.toString(), (Object[]) suffixes).toLowerCase();
  }

  protected Class<?> createConnectionConfigClass(String connectionType, String connectionPackage)
      throws ClassNotFoundException {
    String clazzName =
        "org.openmetadata.catalog.services.connections." + connectionPackage + "." + connectionType + "Connection";
    return Class.forName(clazzName);
  }

  protected String extractConnectionPackageName(ServiceType serviceType) {
    return CaseFormat.UPPER_CAMEL.to(CaseFormat.LOWER_CAMEL, serviceType.value());
  }
}
