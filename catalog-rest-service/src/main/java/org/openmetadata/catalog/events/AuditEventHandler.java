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

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import lombok.extern.slf4j.Slf4j;
import org.jdbi.v3.core.Jdbi;
import org.openmetadata.catalog.CatalogApplicationConfig;
import org.openmetadata.catalog.EntityInterface;
import org.openmetadata.catalog.type.AuditLog;
import org.openmetadata.catalog.type.EntityReference;
import org.slf4j.Marker;
import org.slf4j.MarkerFactory;

@Slf4j
public class AuditEventHandler implements EventHandler {
  private final Marker auditMarker = MarkerFactory.getMarker("AUDIT");

  public void init(CatalogApplicationConfig config, Jdbi jdbi) {
    // Nothing to do
  }

  public Void process(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
    int responseCode = responseContext.getStatus();
    String method = requestContext.getMethod();
    if (responseContext.getEntity() != null) {
      String path = requestContext.getUriInfo().getPath();
      String username = requestContext.getSecurityContext().getUserPrincipal().getName();
      try {
        EntityReference entityReference = ((EntityInterface) responseContext.getEntity()).getEntityReference();
        AuditLog auditLog =
            new AuditLog()
                .withPath(path)
                .withTimestamp(System.currentTimeMillis())
                .withEntityId(entityReference.getId())
                .withEntityType(entityReference.getType())
                .withMethod(AuditLog.Method.fromValue(method))
                .withUserName(username)
                .withResponseCode(responseCode);
        LOG.info(auditMarker, String.format("Added audit log entry: %s", auditLog));
      } catch (Exception e) {
        LOG.error(
            auditMarker,
            String.format("Failed to capture audit log for %s and method %s due to %s", path, method, e.getMessage()));
      }
    }
    return null;
  }

  public void close() {
    /* Nothing to do */
  }
}
