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

package org.openmetadata.service.events;

import static org.openmetadata.schema.type.EventType.ENTITY_DELETED;
import static org.openmetadata.service.events.subscription.AlertsRuleEvaluator.getEntity;
import static org.openmetadata.service.formatter.util.FormatterUtil.getChangeEventFromResponseContext;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.core.SecurityContext;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.type.ChangeEvent;
import org.openmetadata.service.Entity;
import org.openmetadata.service.OpenMetadataApplicationConfig;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.WebsocketNotificationHandler;

@Slf4j
public class ChangeEventHandler implements EventHandler {
  private final WebsocketNotificationHandler websocketNotificationHandler =
      new WebsocketNotificationHandler();

  public void init(OpenMetadataApplicationConfig config) {}

  @SneakyThrows
  public Void process(
      ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
    // GET operations don't produce change events , Response has no entity to produce change event
    // from
    if (requestContext.getMethod().equals("GET") || responseContext.getEntity() == null) {
      return null;
    }

    // Send to Notification Handler
    websocketNotificationHandler.processNotifications(responseContext);

    // Send to Change Event Table
    SecurityContext securityContext = requestContext.getSecurityContext();
    String loggedInUserName = securityContext.getUserPrincipal().getName();
    try {
      Optional<ChangeEvent> optionalChangeEvent =
          getChangeEventFromResponseContext(responseContext, loggedInUserName);
      if (optionalChangeEvent.isPresent()) {
        ChangeEvent changeEvent = optionalChangeEvent.get();
        if (changeEvent.getEntityType().equals(Entity.QUERY)) {
          return null;
        }
        // Always set the Change Event Username as context Principal, the one creating the CE
        changeEvent.setUserName(loggedInUserName);
        LOG.debug(
            "Recording change event {}:{}:{}:{}",
            changeEvent.getTimestamp(),
            changeEvent.getEntityId(),
            changeEvent.getEventType(),
            changeEvent.getEntityType());
        if (changeEvent.getEntity() != null) {
          Object entity = changeEvent.getEntity();
          changeEvent = copyChangeEvent(changeEvent);
          changeEvent.setEntity(JsonUtils.pojoToMaskedJson(entity));
        }

        // Thread are created in FeedRepository Directly
        Entity.getCollectionDAO().changeEventDAO().insert(JsonUtils.pojoToJson(changeEvent));

        // Delete all conversations related to the entity
        if (changeEvent.getEventType().equals(ENTITY_DELETED)) {
          deleteAllConversationsRelatedToEntity(getEntity(changeEvent), Entity.getCollectionDAO());
        }
      }
    } catch (Exception e) {
      LOG.error(
          "Failed to capture the change event for method {} due to ",
          requestContext.getMethod(),
          e);
    }
    return null;
  }

  private static ChangeEvent copyChangeEvent(ChangeEvent changeEvent) {
    return new ChangeEvent()
        .withId(changeEvent.getId())
        .withEventType(changeEvent.getEventType())
        .withEntityId(changeEvent.getEntityId())
        .withEntityType(changeEvent.getEntityType())
        .withUserName(changeEvent.getUserName())
        .withTimestamp(changeEvent.getTimestamp())
        .withChangeDescription(changeEvent.getChangeDescription())
        .withCurrentVersion(changeEvent.getCurrentVersion());
  }

  private void deleteAllConversationsRelatedToEntity(
      EntityInterface entityInterface, CollectionDAO collectionDAO) {
    String entityId = entityInterface.getId().toString();
    List<String> threadIds = collectionDAO.feedDAO().findByEntityId(entityId);
    for (String threadId : threadIds) {
      UUID id = UUID.fromString(threadId);
      collectionDAO.relationshipDAO().deleteAll(id, Entity.THREAD);
      collectionDAO.feedDAO().delete(id);
    }
  }

  public void close() {
    /* Nothing to do */
  }
}
