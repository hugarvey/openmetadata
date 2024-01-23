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

package org.openmetadata.service.resources.feeds;

import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;
import static org.openmetadata.schema.type.EventType.SUGGESTION_CREATED;
import static org.openmetadata.schema.type.EventType.SUGGESTION_UPDATED;
import static org.openmetadata.service.util.RestUtil.CHANGE_CUSTOM_HEADER;

import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import org.openmetadata.schema.api.feed.CreateSuggestion;
import org.openmetadata.schema.entity.feed.Suggestion;
import org.openmetadata.schema.entity.feed.Thread;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.MetadataOperation;
import org.openmetadata.schema.type.SuggestionStatus;
import org.openmetadata.schema.type.SuggestionType;
import org.openmetadata.schema.type.TagLabel;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.SuggestionRepository;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.tags.TagLabelUtil;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.security.policyevaluator.OperationContext;
import org.openmetadata.service.security.policyevaluator.PostResourceContext;
import org.openmetadata.service.security.policyevaluator.ResourceContextInterface;
import org.openmetadata.service.util.RestUtil;
import org.openmetadata.service.util.ResultList;
import org.openmetadata.service.util.UserUtil;

@Path("/v1/suggestions")
@Tag(
    name = "Suggestions",
    description =
        "Suggestions API supports ability to add suggestion for descriptions or tag labels for Entities.")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "suggestions")
public class SuggestionsResource {
  public static final String COLLECTION_PATH = "/v1/suggestions/";
  private final SuggestionRepository dao;
  private final Authorizer authorizer;

  public static void addHref(UriInfo uriInfo, List<Suggestion> suggestions) {
    if (uriInfo != null) {
      suggestions.forEach(t -> addHref(uriInfo, t));
    }
  }

  public static Suggestion addHref(UriInfo uriInfo, Suggestion suggestion) {
    if (uriInfo != null) {
      suggestion.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, suggestion.getId()));
    }
    return suggestion;
  }

  public SuggestionsResource(Authorizer authorizer) {
    this.dao = Entity.getSuggestionRepository();
    this.authorizer = authorizer;
  }

  public static class SuggestionList extends ResultList<Suggestion> {
    /* Required for serde */
  }

  @GET
  @Operation(
      operationId = "listSuggestions",
      summary = "List Suggestions",
      description =
          "Get a list of suggestions, optionally filtered by `entityLink` or `entityFQN`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of Suggestions",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = SuggestionList.class)))
      })
  public ResultList<Thread> list(
      @Context UriInfo uriInfo,
      @Parameter(
              description =
                  "Limit the number of suggestions returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @Min(1)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(
              description = "Returns list of threads before this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(
              description = "Returns list of threads after this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description =
                  "Filter threads by entity link of entity about which this thread is created",
              schema =
                  @Schema(type = "string", example = "<E#/{entityType}/{entityFQN}/{fieldName}>"))
          @QueryParam("entityLink")
          String entityLink,
      @Parameter(
              description =
                  "Filter threads by user id or bot id. This filter requires a 'filterType' query param.",
              schema = @Schema(type = "string"))
          @QueryParam("userId")
          UUID userId,
      @Parameter(
              description =
                  "Filter threads by whether they are accepted or rejected. By default status is OPEN.")
          @DefaultValue("OPEN")
          @QueryParam("status")
          String status) {
    RestUtil.validateCursors(before, after);
    return null;
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getSuggestionByID",
      summary = "Get a suggestion by Id",
      description = "Get a suggestion by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The Suggestion",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Suggestion.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Suggestion for instance {id} is not found")
      })
  public Suggestion get(
      @Context UriInfo uriInfo,
      @Parameter(description = "Id of the Thread", schema = @Schema(type = "string"))
          @PathParam("id")
          UUID id) {
    return addHref(uriInfo, dao.get(id));
  }

  @PUT
  @Path("/{id}/accept")
  @Operation(
      operationId = "acceptSuggestion",
      summary = "Close a task",
      description = "Close a task without making any changes to the entity.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The task thread.",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Suggestion.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response acceptSuggestion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the suggestion", schema = @Schema(type = "string"))
          @PathParam("id")
          UUID id) {
    Suggestion suggestion = dao.get(id);
    dao.checkPermissionsForAcceptOrRejectSuggestion(
        suggestion, suggestion.getStatus(), securityContext);
    return dao.acceptSuggestion(uriInfo, suggestion, securityContext.getUserPrincipal().getName())
        .toResponse();
  }

  @PUT
  @Path("/{id}")
  @Operation(
      operationId = "updateSuggestion",
      summary = "Update a suggestion by `Id`.",
      description = "Update an existing suggestion using JsonPatch.",
      externalDocs =
          @ExternalDocumentation(
              description = "JsonPatch RFC",
              url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response updateSuggestion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the Suggestion", schema = @Schema(type = "string"))
          @PathParam("id")
          String id,
      @Valid Suggestion suggestion) {
    suggestion.setCreatedBy(UserUtil.getUserOrBot(securityContext.getUserPrincipal().getName()));
    suggestion.setCreatedAt(System.currentTimeMillis());
    addHref(uriInfo, dao.update(suggestion, securityContext.getUserPrincipal().getName()));
    return Response.created(suggestion.getHref())
        .entity(suggestion)
        .header(CHANGE_CUSTOM_HEADER, SUGGESTION_UPDATED)
        .build();
  }

  @POST
  @Operation(
      operationId = "createSuggestion",
      summary = "Create a Suggestion",
      description =
          "Create a new Suggestion. A Suggestion is created about a data asset when a user suggests an update.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The thread",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Suggestion.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createSuggestion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateSuggestion create) {
    Suggestion suggestion = getSuggestion(securityContext, create);
    addHref(uriInfo, dao.create(suggestion));
    return Response.created(suggestion.getHref())
        .entity(suggestion)
        .header(CHANGE_CUSTOM_HEADER, SUGGESTION_CREATED)
        .build();
  }

  @DELETE
  @Path("/{suggestionId}")
  @Operation(
      operationId = "deleteSuggestion",
      summary = "Delete a Suggestion by Id",
      description = "Delete an existing Suggestion and all its relationships.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "thread with {threadId} is not found"),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response deleteSuggestion(
      @Context SecurityContext securityContext,
      @Parameter(
              description = "ThreadId of the thread to be deleted",
              schema = @Schema(type = "string"))
          @PathParam("suggestionId")
          UUID suggestionId) {
    // validate and get the thread
    Suggestion suggestion = dao.get(suggestionId);
    // delete thread only if the admin/bot/author tries to delete it
    OperationContext operationContext =
        new OperationContext(Entity.SUGGESTION, MetadataOperation.DELETE);
    ResourceContextInterface resourceContext =
        new PostResourceContext(suggestion.getCreatedBy().getName());
    authorizer.authorize(securityContext, operationContext, resourceContext);
    return dao.deleteSuggestion(suggestion, securityContext.getUserPrincipal().getName())
        .toResponse();
  }

  private Suggestion getSuggestion(SecurityContext securityContext, CreateSuggestion create) {
    validate(create);
    return new Suggestion()
        .withId(UUID.randomUUID())
        .withDescription(create.getDescription())
        .withEntityLink(create.getEntityLink())
        .withType(create.getType())
        .withDescription(create.getDescription())
        .withTagLabels(create.getTagLabels())
        .withStatus(SuggestionStatus.Open)
        .withCreatedBy(UserUtil.getUserOrBot(securityContext.getUserPrincipal().getName()))
        .withCreatedAt(System.currentTimeMillis())
        .withUpdatedBy(securityContext.getUserPrincipal().getName())
        .withUpdatedAt(System.currentTimeMillis());
  }

  private void validate(CreateSuggestion suggestion) {
    if (suggestion.getEntityLink() == null) {
      throw new WebApplicationException("Suggestion's entityLink cannot be null.");
    }
    MessageParser.EntityLink entityLink =
        MessageParser.EntityLink.parse(suggestion.getEntityLink());
    Entity.getEntityReferenceByName(
        entityLink.getEntityType(), entityLink.getEntityFQN(), Include.NON_DELETED);
    if (suggestion.getType() == SuggestionType.SuggestDescription) {
      if (suggestion.getDescription() == null || suggestion.getDescription().isEmpty()) {
        throw new WebApplicationException("Suggestion's description cannot be empty.");
      }
    } else if (suggestion.getType() == SuggestionType.SuggestTagLabel) {
      if (suggestion.getTagLabels().isEmpty()) {
        throw new WebApplicationException("Suggestion's tag label's cannot be empty.");
      } else {
        for (TagLabel label : listOrEmpty(suggestion.getTagLabels())) {
          TagLabelUtil.applyTagCommonFields(label);
        }
      }
    } else {
      throw new WebApplicationException("Invalid Suggestion Type.");
    }
  }
}
