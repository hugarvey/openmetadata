package org.openmetadata.service.jdbi3;

import static org.openmetadata.schema.type.EventType.SUGGESTION_ACCEPTED;
import static org.openmetadata.schema.type.EventType.SUGGESTION_DELETED;
import static org.openmetadata.schema.type.EventType.SUGGESTION_REJECTED;
import static org.openmetadata.schema.type.Include.ALL;
import static org.openmetadata.schema.type.Include.NON_DELETED;
import static org.openmetadata.schema.type.Relationship.CREATED;
import static org.openmetadata.schema.type.Relationship.IS_ABOUT;
import static org.openmetadata.service.Entity.TEAM;
import static org.openmetadata.service.Entity.USER;
import static org.openmetadata.service.jdbi3.UserRepository.TEAMS_FIELD;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.json.JsonPatch;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.jdbi.v3.sqlobject.transaction.Transaction;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.entity.feed.Suggestion;
import org.openmetadata.schema.entity.teams.Team;
import org.openmetadata.schema.entity.teams.User;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.SuggestionStatus;
import org.openmetadata.schema.type.SuggestionType;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.ResourceRegistry;
import org.openmetadata.service.exception.CatalogExceptionMessage;
import org.openmetadata.service.exception.EntityNotFoundException;
import org.openmetadata.service.resources.feeds.MessageParser;
import org.openmetadata.service.resources.feeds.SuggestionsResource;
import org.openmetadata.service.security.AuthorizationException;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.security.policyevaluator.OperationContext;
import org.openmetadata.service.security.policyevaluator.ResourceContext;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.RestUtil;
import org.openmetadata.service.util.ResultList;

@Slf4j
@Repository
public class SuggestionRepository {
  private final CollectionDAO dao;

  public enum PaginationType {
    BEFORE,
    AFTER
  }

  public SuggestionRepository() {
    this.dao = Entity.getCollectionDAO();
    Entity.setSuggestionRepository(this);
    ResourceRegistry.addResource("suggestion", null, Entity.getEntityFields(Suggestion.class));
  }

  @Transaction
  public Suggestion create(Suggestion suggestion) {
    store(suggestion);
    storeRelationships(suggestion);
    return suggestion;
  }

  @Transaction
  public Suggestion update(Suggestion suggestion, String userName) {
    suggestion.setUpdatedBy(userName);
    dao.suggestionDAO().update(suggestion.getId(), JsonUtils.pojoToJson(suggestion));
    storeRelationships(suggestion);
    return suggestion;
  }

  @Transaction
  public void store(Suggestion suggestion) {
    // Insert a new Suggestion
    MessageParser.EntityLink entityLink =
        MessageParser.EntityLink.parse(suggestion.getEntityLink());
    dao.suggestionDAO().insert(entityLink.getEntityFQN(), JsonUtils.pojoToJson(suggestion));
  }

  @Transaction
  public void storeRelationships(Suggestion suggestion) {
    MessageParser.EntityLink entityLink =
        MessageParser.EntityLink.parse(suggestion.getEntityLink());
    // Add relationship User -- created --> Suggestion relationship
    dao.relationshipDAO()
        .insert(
            suggestion.getCreatedBy().getId(),
            suggestion.getId(),
            suggestion.getCreatedBy().getType(),
            Entity.SUGGESTION,
            CREATED.ordinal());

    // Add field relationship for data asset - Suggestion -- entityLink ---> entity/entityField
    dao.fieldRelationshipDAO()
        .insert(
            suggestion.getId().toString(), // from FQN
            entityLink.getFullyQualifiedFieldValue(), // to FQN,
            suggestion.getId().toString(),
            entityLink.getFullyQualifiedFieldValue(),
            Entity.SUGGESTION, // From type
            entityLink.getFullyQualifiedFieldType(), // to Type
            IS_ABOUT.ordinal(),
            null);
  }

  public Suggestion get(UUID id) {
    return EntityUtil.validate(id, dao.suggestionDAO().findById(id), Suggestion.class);
  }

  @Transaction
  public RestUtil.DeleteResponse<Suggestion> deleteSuggestion(
      Suggestion suggestion, String deletedByUser) {
    deleteSuggestionInternal(suggestion.getId());
    LOG.debug("{} deleted suggestion with id {}", deletedByUser, suggestion.getId());
    return new RestUtil.DeleteResponse<>(suggestion, SUGGESTION_DELETED);
  }

  @Transaction
  public RestUtil.DeleteResponse<EntityInterface> deleteSuggestionsForAnEntity(
      EntityInterface entity, String deletedByUser) {
    deleteSuggestionInternalForAnEntity(entity);
    LOG.debug("{} deleted suggestions for the entity id {}", deletedByUser, entity.getId());
    return new RestUtil.DeleteResponse<>(entity, SUGGESTION_DELETED);
  }

  @Transaction
  public void deleteSuggestionInternal(UUID id) {
    // Delete all the relationships to other entities
    dao.relationshipDAO().deleteAll(id, Entity.SUGGESTION);

    // Delete all the field relationships to other entities
    dao.fieldRelationshipDAO().deleteAllByPrefix(id.toString());

    // Finally, delete the suggestion
    dao.suggestionDAO().delete(id);
  }

  @Transaction
  public void deleteSuggestionInternalForAnEntity(EntityInterface entity) {
    // Delete all the field relationships to other entities
    dao.fieldRelationshipDAO().deleteAllByPrefix(entity.getId().toString());

    // Finally, delete the suggestion
    dao.suggestionDAO().deleteByFQN(entity.getFullyQualifiedName());
  }

  @Getter
  public static class SuggestionWorkflow {
    protected final EntityRepository<?> repository;
    // The workflow is applied to a specific entity at a time
    protected final EntityInterface entity;

    SuggestionWorkflow(EntityRepository<?> repository, EntityInterface entity) {
      this.repository = repository;
      this.entity = entity;
    }

    public EntityInterface acceptSuggestions(Suggestion suggestion, EntityInterface entity) {
      MessageParser.EntityLink entityLink = MessageParser.EntityLink.parse(suggestion.getEntityLink());
      if (entityLink.getFieldName() != null) {
        return repository.applySuggestion(
              entity, entityLink.getFullyQualifiedFieldValue(), suggestion);
      } else {
        if (suggestion.getType().equals(SuggestionType.SuggestTagLabel)) {
          List<TagLabel> tags = new ArrayList<>(entity.getTags());
          tags.addAll(suggestion.getTagLabels());
          entity.setTags(tags);
          return entity;
        } else if (suggestion.getType().equals(SuggestionType.SuggestDescription)) {
          entity.setDescription(suggestion.getDescription());
          return entity;
        } else {
          throw new WebApplicationException("Invalid suggestion Type");
        }
      }
    }
  }

  public RestUtil.PutResponse<Suggestion> acceptSuggestion(
      UriInfo uriInfo,
      Suggestion suggestion,
      SecurityContext securityContext,
      Authorizer authorizer) {
    acceptSuggestion(suggestion, securityContext, authorizer);
    Suggestion updatedHref = SuggestionsResource.addHref(uriInfo, suggestion);
    return new RestUtil.PutResponse<>(Response.Status.OK, updatedHref, SUGGESTION_ACCEPTED);
  }

  protected void acceptSuggestion(
      Suggestion suggestion, SecurityContext securityContext, Authorizer authorizer) {
    String user = securityContext.getUserPrincipal().getName();
    MessageParser.EntityLink entityLink =
        MessageParser.EntityLink.parse(suggestion.getEntityLink());
    EntityInterface entity =
        Entity.getEntity(
            entityLink, suggestion.getType() == SuggestionType.SuggestTagLabel ? "tags" : "", ALL);
    EntityRepository<?> repository = Entity.getEntityRepository(entityLink.getEntityType());
    // Prepare the original JSON before updating the Entity, otherwise we get an empty patch
    String origJson = JsonUtils.pojoToJson(entity);
    SuggestionWorkflow suggestionWorkflow = repository.getSuggestionWorkflow(repository, entity);

    EntityInterface updatedEntity = suggestionWorkflow.acceptSuggestions(suggestion, entity);
    String updatedEntityJson = JsonUtils.pojoToJson(updatedEntity);

    // Patch the entity with the updated suggestions
    JsonPatch patch = JsonUtils.getJsonPatch(origJson, updatedEntityJson);

    OperationContext operationContext = new OperationContext(entityLink.getEntityType(), patch);
    authorizer.authorize(
        securityContext,
        operationContext,
        new ResourceContext<>(entityLink.getEntityType(), entity.getId(), null));
    repository.patch(null, entity.getId(), user, patch);
    suggestion.setStatus(SuggestionStatus.Accepted);
    update(suggestion, user);
  }

  public RestUtil.PutResponse<Suggestion> rejectSuggestion(
      UriInfo uriInfo, Suggestion suggestion, String user) {
    suggestion.setStatus(SuggestionStatus.Rejected);
    update(suggestion, user);
    Suggestion updatedHref = SuggestionsResource.addHref(uriInfo, suggestion);
    return new RestUtil.PutResponse<>(Response.Status.OK, updatedHref, SUGGESTION_REJECTED);
  }

  public void checkPermissionsForUpdateSuggestion(
      Suggestion suggestion, SecurityContext securityContext) {
    String userName = securityContext.getUserPrincipal().getName();
    User user = Entity.getEntityByName(USER, userName, TEAMS_FIELD, NON_DELETED);
    if (Boolean.FALSE.equals(user.getIsAdmin())
        && !userName.equalsIgnoreCase(suggestion.getCreatedBy().getName())) {
      throw new AuthorizationException(
          CatalogExceptionMessage.suggestionOperationNotAllowed(userName, "Update"));
    }
  }

  public void checkPermissionsForAcceptOrRejectSuggestion(
      Suggestion suggestion, SuggestionStatus status, SecurityContext securityContext) {
    String userName = securityContext.getUserPrincipal().getName();
    User user = Entity.getEntityByName(USER, userName, TEAMS_FIELD, NON_DELETED);
    MessageParser.EntityLink about = MessageParser.EntityLink.parse(suggestion.getEntityLink());
    EntityReference aboutRef = EntityUtil.validateEntityLink(about);
    EntityReference ownerRef = Entity.getOwner(aboutRef);
    List<String> ownerTeamNames = new ArrayList<>();
    if (ownerRef != null) {
      try {
        User owner =
            Entity.getEntityByName(
                USER, ownerRef.getFullyQualifiedName(), TEAMS_FIELD, NON_DELETED);
        ownerTeamNames =
            owner.getTeams().stream().map(EntityReference::getFullyQualifiedName).toList();
      } catch (EntityNotFoundException e) {
        Team owner =
            Entity.getEntityByName(TEAM, ownerRef.getFullyQualifiedName(), "", NON_DELETED);
        ownerTeamNames.add(owner.getFullyQualifiedName());
      }
    }

    List<String> userTeamNames =
        user.getTeams().stream().map(EntityReference::getFullyQualifiedName).toList();

    if (Boolean.FALSE.equals(user.getIsAdmin())
        && (ownerRef != null && !ownerRef.getName().equals(userName))
        && Collections.disjoint(userTeamNames, ownerTeamNames)) {
      throw new AuthorizationException(
          CatalogExceptionMessage.suggestionOperationNotAllowed(userName, status.value()));
    }
  }

  public int listCount(SuggestionFilter filter) {
    String mySqlCondition = filter.getCondition(false);
    String postgresCondition = filter.getCondition(false);
    return dao.suggestionDAO().listCount(mySqlCondition, postgresCondition);
  }

  public ResultList<Suggestion> listBefore(SuggestionFilter filter, int limit, String before) {
    int total = listCount(filter);
    String mySqlCondition = filter.getCondition(true);
    String postgresCondition = filter.getCondition(true);
    List<String> jsons =
        dao.suggestionDAO()
            .listBefore(
                mySqlCondition, postgresCondition, limit + 1, RestUtil.decodeCursor(before));
    List<Suggestion> suggestions = getSuggestionList(jsons);
    String beforeCursor = null;
    String afterCursor;
    if (suggestions.size() > limit) {
      suggestions.remove(0);
      beforeCursor = suggestions.get(0).getUpdatedAt().toString();
    }
    afterCursor =
        !suggestions.isEmpty()
            ? suggestions.get(suggestions.size() - 1).getUpdatedAt().toString()
            : null;
    return new ResultList<>(suggestions, beforeCursor, afterCursor, total);
  }

  public ResultList<Suggestion> listAfter(SuggestionFilter filter, int limit, String after) {
    int total = listCount(filter);
    String mySqlCondition = filter.getCondition(true);
    String postgresCondition = filter.getCondition(true);
    List<String> jsons =
        dao.suggestionDAO()
            .listAfter(mySqlCondition, postgresCondition, limit + 1, RestUtil.decodeCursor(after));
    List<Suggestion> suggestions = getSuggestionList(jsons);
    String beforeCursor;
    String afterCursor = null;
    beforeCursor = after == null ? null : suggestions.get(0).getUpdatedAt().toString();
    if (suggestions.size() > limit) {
      suggestions.remove(limit);
      afterCursor = suggestions.get(limit - 1).getUpdatedAt().toString();
    }
    return new ResultList<>(suggestions, beforeCursor, afterCursor, total);
  }

  private List<Suggestion> getSuggestionList(List<String> jsons) {
    List<Suggestion> suggestions = new ArrayList<>();
    for (String json : jsons) {
      Suggestion suggestion = JsonUtils.readValue(json, Suggestion.class);
      suggestions.add(suggestion);
    }
    return suggestions;
  }

  public final List<Suggestion> listAll(SuggestionFilter filter) {
    ResultList<Suggestion> suggestionList = listAfter(filter, Integer.MAX_VALUE, "");
    return suggestionList.getData();
  }

  public final List<RestUtil.PutResponse<Suggestion>> acceptAllSuggestions(UriInfo uriInfo,List<Suggestion> suggestions, SecurityContext securityContext, Authorizer authorizer) {
    return suggestions.stream().map(
        suggestion -> {
          try {
            checkPermissionsForAcceptOrRejectSuggestion(suggestion, SuggestionStatus.Accepted, securityContext);
            return acceptSuggestion(uriInfo, suggestion, securityContext, authorizer);
          } catch (AuthorizationException e) {
            return new RestUtil.PutResponse<>(Response.Status.FORBIDDEN, suggestion, SUGGESTION_REJECTED);
          }
        }
    ).collect(Collectors.toList());
  }
}
