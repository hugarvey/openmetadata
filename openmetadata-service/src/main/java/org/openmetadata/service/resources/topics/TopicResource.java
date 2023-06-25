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

package org.openmetadata.service.resources.topics;

import static org.openmetadata.common.utils.CommonUtil.listOf;

import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import javax.json.JsonPatch;
import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.PATCH;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.UriInfo;
import org.openmetadata.schema.api.data.CreateTopic;
import org.openmetadata.schema.api.data.RestoreEntity;
import org.openmetadata.schema.entity.data.Topic;
import org.openmetadata.schema.type.ChangeEvent;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.MetadataOperation;
import org.openmetadata.schema.type.topic.TopicSampleData;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.jdbi3.TopicRepository;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.security.mask.PIIMasker;
import org.openmetadata.service.security.policyevaluator.OperationContext;
import org.openmetadata.service.security.policyevaluator.ResourceContext;
import org.openmetadata.service.util.ResultList;

@Path("/v1/topics")
@Tag(
    name = "Topics",
    description =
        "A `Topic` is a feed or an event stream in a `Messaging Service` "
            + "into which publishers publish messages and consumed by consumers.")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "topics")
public class TopicResource extends EntityResource<Topic, TopicRepository> {
  public static final String COLLECTION_PATH = "v1/topics/";
  static final String FIELDS = "owner,followers,tags,extension";

  @Override
  public Topic addHref(UriInfo uriInfo, Topic topic) {
    Entity.withHref(uriInfo, topic.getOwner());
    Entity.withHref(uriInfo, topic.getService());
    Entity.withHref(uriInfo, topic.getFollowers());
    return topic;
  }

  public TopicResource(CollectionDAO dao, Authorizer authorizer) {
    super(Topic.class, new TopicRepository(dao), authorizer);
  }

  @Override
  protected List<MetadataOperation> getEntitySpecificOperations() {
    addViewOperation("sampleData", MetadataOperation.VIEW_SAMPLE_DATA);
    return listOf(MetadataOperation.VIEW_SAMPLE_DATA, MetadataOperation.EDIT_SAMPLE_DATA);
  }

  public static class TopicList extends ResultList<Topic> {
    /* Required for serde */
  }

  @GET
  @Operation(
      operationId = "listTopics",
      summary = "List topics",
      description =
          "Get a list of topics, optionally filtered by `service` it belongs to. Use `fields` "
              + "parameter to get only necessary fields. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of topics",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = TopicList.class)))
      })
  public ResultList<Topic> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Filter topics by service name",
              schema = @Schema(type = "string", example = "kafkaWestCoast"))
          @QueryParam("service")
          String serviceParam,
      @Parameter(description = "Limit the number topics returned. (1 to 1000000, default = " + "10)")
          @DefaultValue("10")
          @QueryParam("limit")
          @Min(0)
          @Max(1000000)
          int limitParam,
      @Parameter(description = "Returns list of topics before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of topics after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    ListFilter filter = new ListFilter(include).addQueryParam("service", serviceParam);
    return super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllTopicVersion",
      summary = "List topic versions",
      description = "Get a list of all the versions of a topic identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of topic versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}")
  @Operation(
      summary = "Get a topic by id",
      description = "Get a topic by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The topic",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class))),
        @ApiResponse(responseCode = "404", description = "Topic for instance {id} is not found")
      })
  public Topic get(
      @Context UriInfo uriInfo,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    return getInternal(uriInfo, securityContext, id, fieldsParam, include);
  }

  @GET
  @Path("/name/{fqn}")
  @Operation(
      operationId = "getTopicByFQN",
      summary = "Get a topic by fully qualified name",
      description = "Get a topic by fully qualified name.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The topic",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class))),
        @ApiResponse(responseCode = "404", description = "Topic for instance {fqn} is not found")
      })
  public Topic getByName(
      @Context UriInfo uriInfo,
      @Parameter(description = "Fully qualified name of the topic", schema = @Schema(type = "string")) @PathParam("fqn")
          String fqn,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    return getByNameInternal(uriInfo, securityContext, fqn, fieldsParam, include);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificTopicVersion",
      summary = "Get a version of the topic",
      description = "Get a version of the topic by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "topic",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Topic for instance {id} and version {version} is " + "not found")
      })
  public Topic getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(
              description = "Topic version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createTopic",
      summary = "Create a topic",
      description = "Create a topic under an existing `service`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The topic",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(@Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateTopic create)
      throws IOException {
    Topic topic = getTopic(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, topic);
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchTopic",
      summary = "Update a topic",
      description = "Update an existing topic using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response updateDescription(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[" + "{op:remove, path:/a}," + "{op:add, path: /b, value: val}" + "]")
                      }))
          JsonPatch patch)
      throws IOException {
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateTopic",
      summary = "Update topic",
      description = "Create a topic, it it does not exist or update an existing topic.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The updated topic ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class)))
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateTopic create)
      throws IOException {
    Topic topic = getTopic(create, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, topic);
  }

  @PUT
  @Path("/{id}/sampleData")
  @Operation(
      operationId = "addSampleData",
      summary = "Add sample data",
      description = "Add sample data to the topic.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The topic",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class))),
      })
  public Topic addSampleData(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Valid TopicSampleData sampleData)
      throws IOException {
    OperationContext operationContext = new OperationContext(entityType, MetadataOperation.EDIT_SAMPLE_DATA);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    Topic topic = repository.addSampleData(id, sampleData);
    return addHref(uriInfo, topic);
  }

  @GET
  @Path("/{id}/sampleData")
  @Operation(
      operationId = "getSampleData",
      summary = "Get sample data",
      description = "Get sample data from the topic.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully obtained the Topic",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class)))
      })
  public Topic getSampleData(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException {
    OperationContext operationContext = new OperationContext(entityType, MetadataOperation.VIEW_SAMPLE_DATA);
    ResourceContext resourceContext = getResourceContextById(id);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    boolean authorizePII = authorizer.authorizePII(securityContext, resourceContext.getOwner());

    Topic maskedTopic = PIIMasker.getSampleData(repository.getSampleData(id, authorizePII), authorizePII);
    return addHref(uriInfo, maskedTopic);
  }

  @PUT
  @Path("/{id}/followers")
  @Operation(
      operationId = "addFollower",
      summary = "Add a follower",
      description = "Add a user identified by `userId` as followed of this topic",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "OK",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChangeEvent.class))),
        @ApiResponse(responseCode = "404", description = "Topic for instance {id} is not found")
      })
  public Response addFollower(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(description = "Id of the user to be added as follower", schema = @Schema(type = "UUID")) UUID userId)
      throws IOException {
    return repository.addFollower(securityContext.getUserPrincipal().getName(), id, userId).toResponse();
  }

  @DELETE
  @Path("/{id}/followers/{userId}")
  @Operation(
      summary = "Remove a follower",
      description = "Remove the user identified `userId` as a follower of the topic.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "OK",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChangeEvent.class)))
      })
  public Response deleteFollower(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(description = "Id of the user being removed as follower", schema = @Schema(type = "string"))
          @PathParam("userId")
          String userId)
      throws IOException {
    return repository
        .deleteFollower(securityContext.getUserPrincipal().getName(), id, UUID.fromString(userId))
        .toResponse();
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteTopic",
      summary = "Delete a topic by id",
      description = "Delete a topic by `id`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Topic for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Id of the topic", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException {
    return delete(uriInfo, securityContext, id, false, hardDelete);
  }

  @DELETE
  @Path("/name/{fqn}")
  @Operation(
      operationId = "deleteTopicByFQN",
      summary = "Delete a topic by fully qualified name",
      description = "Delete a topic by `fullyQualifiedName`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Topic for instance {fqn} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Fully qualified name of the topic", schema = @Schema(type = "string")) @PathParam("fqn")
          String fqn)
      throws IOException {
    return deleteByName(uriInfo, securityContext, fqn, false, hardDelete);
  }

  @PUT
  @Path("/restore")
  @Operation(
      operationId = "restore",
      summary = "Restore a soft deleted topic",
      description = "Restore a soft deleted topic.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully restored the Topic. ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Topic.class)))
      })
  public Response restoreTopic(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid RestoreEntity restore)
      throws IOException {
    return restoreEntity(uriInfo, securityContext, restore.getId());
  }

  private Topic getTopic(CreateTopic create, String user) throws IOException {
    return copy(new Topic(), create, user)
        .withService(getEntityReference(Entity.MESSAGING_SERVICE, create.getService()))
        .withPartitions(create.getPartitions())
        .withMessageSchema(create.getMessageSchema())
        .withCleanupPolicies(create.getCleanupPolicies())
        .withMaximumMessageSize(create.getMaximumMessageSize())
        .withMinimumInSyncReplicas(create.getMinimumInSyncReplicas())
        .withRetentionSize(create.getRetentionSize())
        .withRetentionTime(create.getRetentionTime())
        .withReplicationFactor(create.getReplicationFactor())
        .withTopicConfig(create.getTopicConfig())
        .withTags(create.getTags());
  }
}
