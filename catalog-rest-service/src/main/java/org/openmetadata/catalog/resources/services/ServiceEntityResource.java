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

package org.openmetadata.catalog.resources.services;

import java.util.Collections;
import java.util.Optional;
import javax.ws.rs.core.SecurityContext;
import lombok.Getter;
import org.openmetadata.catalog.ServiceConnectionEntityInterface;
import org.openmetadata.catalog.ServiceEntityInterface;
import org.openmetadata.catalog.entity.services.ServiceType;
import org.openmetadata.catalog.jdbi3.ServiceEntityRepository;
import org.openmetadata.catalog.resources.EntityResource;
import org.openmetadata.catalog.secrets.SecretsManager;
import org.openmetadata.catalog.security.AuthorizationException;
import org.openmetadata.catalog.security.Authorizer;
import org.openmetadata.catalog.util.ResultList;

public abstract class ServiceEntityResource<
        T extends ServiceEntityInterface,
        R extends ServiceEntityRepository<T, S>,
        S extends ServiceConnectionEntityInterface>
    extends EntityResource<T, R> {

  private final SecretsManager secretsManager;

  @Getter private final ServiceEntityRepository<T, S> serviceEntityRepository;

  private final ServiceType serviceType;

  protected ServiceEntityResource(
      Class<T> entityClass,
      R serviceRepository,
      Authorizer authorizer,
      SecretsManager secretsManager,
      ServiceType serviceType) {
    super(entityClass, serviceRepository, authorizer);
    this.serviceEntityRepository = serviceRepository;
    this.secretsManager = secretsManager;
    this.serviceType = serviceType;
  }

  protected T decryptOrNullify(SecurityContext securityContext, T service) {
    try {
      authorizer.authorizeAdmin(securityContext, secretsManager.isLocal());
    } catch (AuthorizationException e) {
      return nullifyConnection(service);
    }
    service
        .getConnection()
        .setConfig(
            secretsManager.encryptOrDecryptServiceConnectionConfig(
                service.getConnection().getConfig(),
                extractServiceType(service),
                service.getName(),
                serviceType,
                false));
    return service;
  }

  protected ResultList<T> decryptOrNullify(SecurityContext securityContext, ResultList<T> services) {
    Optional.ofNullable(services.getData())
        .orElse(Collections.emptyList())
        .forEach(mlModelService -> decryptOrNullify(securityContext, mlModelService));
    return services;
  }

  protected abstract T nullifyConnection(T service);

  protected abstract String extractServiceType(T service);
}
