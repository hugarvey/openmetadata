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

package org.openmetadata.service.resources.services.messaging;

import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
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
import org.openmetadata.schema.api.data.RestoreEntity;
import org.openmetadata.schema.api.services.CreateMessagingService;
import org.openmetadata.schema.entity.services.DatabaseService;
import org.openmetadata.schema.entity.services.MessagingService;
import org.openmetadata.schema.entity.services.ServiceType;
import org.openmetadata.schema.entity.services.connections.TestConnectionResult;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.MessagingConnection;
import org.openmetadata.schema.type.MetadataOperation;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.MessagingServiceRepository;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.services.ServiceEntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.security.policyevaluator.OperationContext;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.ResultList;

@Path("/v1/services/messagingServices")
@Tag(name = "Messaging Services")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "messagingServices")
public class MessagingServiceResource
    extends ServiceEntityResource<MessagingService, MessagingServiceRepository, MessagingConnection> {
  public static final String COLLECTION_PATH = "v1/services/messagingServices/";
  public static final String FIELDS = "owner,domain,sourceHash";

  public MessagingServiceResource(Authorizer authorizer) {
    super(Entity.MESSAGING_SERVICE, authorizer, ServiceType.MESSAGING);
  }

  public static class MessagingServiceList extends ResultList<MessagingService> {
    /* Required for serde */
  }

  @GET
  @Operation(
      operationId = "listMessagingService",
      summary = "List messaging services",
      description =
          "Get a list of messaging services. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of messaging services",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingServiceList.class)))
      })
  public ResultList<MessagingService> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Filter services by domain", schema = @Schema(type = "string", example = "Marketing"))
          @QueryParam("domain")
          String domain,
      @Parameter(description = "Limit number services returned. (1 to 1000000, default 10)")
          @DefaultValue("10")
          @Min(0)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(description = "Returns list of services before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of services after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include) {
    return listInternal(uriInfo, securityContext, fieldsParam, include, domain, limitParam, before, after);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getMessagingServiceByID",
      summary = "Get a messaging service by Id",
      description = "Get a messaging service by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "404", description = "Messaging service for instance {id} is not found")
      })
  public MessagingService get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
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
          Include include) {
    MessagingService messagingService = getInternal(uriInfo, securityContext, id, fieldsParam, include);
    return decryptOrNullify(securityContext, messagingService);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getMessagingServiceByFQN",
      summary = "Get messaging service by name",
      description = "Get a messaging service by the service `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "404", description = "Messaging service for instance {name} is not found")
      })
  public MessagingService getByName(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Name of the messaging service", schema = @Schema(type = "string")) @PathParam("name")
          String name,
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
          Include include) {
    MessagingService messagingService = getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
    return decryptOrNullify(securityContext, messagingService);
  }

  @PUT
  @Path("/{id}/testConnectionResult")
  @Operation(
      operationId = "addTestConnectionResult",
      summary = "Add test connection result",
      description = "Add test connection result to the service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully updated the service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = DatabaseService.class)))
      })
  public MessagingService addTestConnectionResult(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the service", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Valid TestConnectionResult testConnectionResult) {
    OperationContext operationContext = new OperationContext(entityType, MetadataOperation.CREATE);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    MessagingService service = repository.addTestConnectionResult(id, testConnectionResult);
    return decryptOrNullify(securityContext, service);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllMessagingServiceVersion",
      summary = "List messaging service versions",
      description = "Get a list of all the versions of a messaging service identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of messaging service versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "UUID")) @PathParam("id")
          UUID id) {
    EntityHistory entityHistory = super.listVersionsInternal(securityContext, id);

    List<Object> versions =
        entityHistory.getVersions().stream()
            .map(
                json -> {
                  try {
                    MessagingService messagingService = JsonUtils.readValue((String) json, MessagingService.class);
                    return JsonUtils.pojoToJson(decryptOrNullify(securityContext, messagingService));
                  } catch (Exception e) {
                    return json;
                  }
                })
            .collect(Collectors.toList());
    entityHistory.setVersions(versions);
    return entityHistory;
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificMessagingServiceVersion",
      summary = "Get a version of the messaging service",
      description = "Get a version of the messaging service by given `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "messaging service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Messaging service for instance {id} and version {version} is not found")
      })
  public MessagingService getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(
              description = "messaging service version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version) {
    MessagingService messagingService = super.getVersionInternal(securityContext, id, version);
    return decryptOrNullify(securityContext, messagingService);
  }

  @POST
  @Operation(
      operationId = "createMessagingService",
      summary = "Create a messaging service",
      description = "Create a new messaging service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateMessagingService create) {
    MessagingService service = getService(create, securityContext.getUserPrincipal().getName());
    Response response = create(uriInfo, securityContext, service);
    decryptOrNullify(securityContext, (MessagingService) response.getEntity());
    return response;
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateMessagingService",
      summary = "Update messaging service",
      description = "Create a new messaging service or Update an existing messaging service identified by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Messaging service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateMessagingService update) {
    MessagingService service = getService(update, securityContext.getUserPrincipal().getName());
    Response response = createOrUpdate(uriInfo, securityContext, unmask(service));
    decryptOrNullify(securityContext, (MessagingService) response.getEntity());
    return response;
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchMessagingService",
      summary = "Update a messaging service",
      description = "Update an existing messaging service using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {@ExampleObject("[{op:remove, path:/a},{op:add, path: /b, value: val}]")}))
          JsonPatch patch) {
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteMessagingService",
      summary = "Delete a messaging service by Id",
      description = "Delete a messaging service. If topics belong the service, it can't be deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "MessagingService service for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Recursively delete this entity and it's children. (Default `false`)")
          @DefaultValue("false")
          @QueryParam("recursive")
          boolean recursive,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Id of the messaging service", schema = @Schema(type = "UUID")) @PathParam("id")
          UUID id) {
    return delete(uriInfo, securityContext, id, recursive, hardDelete);
  }

  @DELETE
  @Path("/name/{name}")
  @Operation(
      operationId = "deleteMessagingServiceByName",
      summary = "Delete a messaging service by name",
      description = "Delete a messaging service by `name`. If topics belong the service, it can't be deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "MessagingService service for instance {name} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Recursively delete this entity and it's children. (Default `false`)")
          @QueryParam("recursive")
          @DefaultValue("false")
          boolean recursive,
      @Parameter(description = "Name of the messaging service", schema = @Schema(type = "string")) @PathParam("name")
          String name) {
    return deleteByName(uriInfo, securityContext, name, recursive, hardDelete);
  }

  @PUT
  @Path("/restore")
  @Operation(
      operationId = "restore",
      summary = "Restore a soft deleted messaging service",
      description = "Restore a soft deleted messaging service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully restored the MessagingService ",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = MessagingService.class)))
      })
  public Response restoreMessagingService(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid RestoreEntity restore) {
    return restoreEntity(uriInfo, securityContext, restore.getId());
  }

  private MessagingService getService(CreateMessagingService create, String user) {
    return repository
        .copy(new MessagingService(), create, user)
        .withConnection(create.getConnection())
        .withServiceType(create.getServiceType())
        .withSourceHash(create.getSourceHash());
  }

  @Override
  protected MessagingService nullifyConnection(MessagingService service) {
    return service.withConnection(null);
  }

  @Override
  protected String extractServiceType(MessagingService service) {
    return service.getServiceType().value();
  }
}
