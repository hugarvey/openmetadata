package org.openmetadata.service.alerts;

import static org.openmetadata.service.Entity.TEAM;
import static org.openmetadata.service.Entity.USER;

import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.Function;
import org.openmetadata.schema.entity.teams.Team;
import org.openmetadata.schema.entity.teams.User;
import org.openmetadata.schema.type.ChangeEvent;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.service.security.policyevaluator.SubjectCache;

@Slf4j
public class AlertsRuleEvaluator {
  private final ChangeEvent changeEvent;

  public AlertsRuleEvaluator(ChangeEvent event) {
    this.changeEvent = event;
  }

  @Function(
      name = "matchAnySource",
      input = "List of comma separated source",
      description = "Returns true if the change event entity being accessed has source as mentioned in condition",
      examples = {"matchAnySource('bot', 'user')"})
  public boolean matchAnySource(String... originEntity) {
    if (changeEvent == null) {
      return false;
    }
    String changeEventEntity = changeEvent.getEntityType();
    for (String entityType : originEntity) {
      if (changeEventEntity.equals(entityType)) {
        return true;
      }
    }
    return false;
  }

  @Function(
      name = "matchAnyOwnerName",
      input = "List of comma separated ownerName",
      description = "Returns true if the change event entity being accessed has following owners from the List.",
      examples = {"matchAnyOwnerName('Owner1', 'Owner2')"})
  public boolean matchAnyOwnerName(String... ownerNameList) {
    if (changeEvent == null || changeEvent.getEntity() == null) {
      return false;
    }
    EntityInterface entity = (EntityInterface) changeEvent.getEntity();
    EntityReference ownerReference = entity.getOwner();
    if (ownerReference != null) {
      if (USER.equals(ownerReference.getType())) {
        User user = SubjectCache.getInstance().getSubjectContext(ownerReference.getId()).getUser();
        for (String name : ownerNameList) {
          if (user.getName().equals(name)) {
            return true;
          }
        }
      } else if (TEAM.equals(ownerReference.getType())) {
        Team team = SubjectCache.getInstance().getTeam(ownerReference.getId());
        for (String name : ownerNameList) {
          if (team.getName().equals(name)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  @Function(
      name = "matchAnyEntityFqn",
      input = "List of comma separated entityName",
      description = "Returns true if the change event entity being accessed has following entityName from the List.",
      examples = {"matchAnyEntityFqn('Name1', 'Name')"})
  public boolean matchAnyEntityFqn(String... entityNames) {
    if (changeEvent == null || changeEvent.getEntity() == null) {
      return false;
    }
    EntityInterface entity = (EntityInterface) changeEvent.getEntity();
    for (String name : entityNames) {
      if (entity.getName().equals(name)) {
        return true;
      }
    }
    return false;
  }

  @Function(
      name = "matchAnyEntityId",
      input = "List of comma separated entityName",
      description = "Returns true if the change event entity being accessed has following entityId from the List.",
      examples = {"matchAnyEntityId('uuid1', 'uuid2')"})
  public boolean matchAnyEntityId(String... entityIds) {
    if (changeEvent == null || changeEvent.getEntity() == null) {
      return false;
    }
    EntityInterface entity = (EntityInterface) changeEvent.getEntity();
    for (String id : entityIds) {
      if (entity.getId().equals(UUID.fromString(id))) {
        return true;
      }
    }
    return false;
  }
}
