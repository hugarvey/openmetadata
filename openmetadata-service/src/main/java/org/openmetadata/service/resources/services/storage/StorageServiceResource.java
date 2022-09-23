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

package org.openmetadata.service.resources.services.storage;

import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
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
import org.openmetadata.schema.api.services.CreateStorageService;
import org.openmetadata.schema.entity.services.StorageService;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.jdbi3.StorageServiceRepository;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.util.RestUtil;
import org.openmetadata.service.util.ResultList;

@Path("/v1/services/storageServices")
@Api(value = "Storage service collection", tags = "Services -> Storage service collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "storageServices")
public class StorageServiceResource extends EntityResource<StorageService, StorageServiceRepository> {
  public static final String COLLECTION_PATH = "v1/services/storageServices/";

  static final String FIELDS = "owner,tags";

  @Override
  public StorageService addHref(UriInfo uriInfo, StorageService service) {
    service.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, service.getId()));
    Entity.withHref(uriInfo, service.getOwner());
    return service;
  }

  public StorageServiceResource(CollectionDAO dao, Authorizer authorizer) {
    super(StorageService.class, new StorageServiceRepository(dao), authorizer);
  }

  public static class StorageServiceList extends ResultList<StorageService> {
    @SuppressWarnings("unused") /* Required for tests */
    public StorageServiceList() {}

    public StorageServiceList(List<StorageService> data, String beforeCursor, String afterCursor, int total) {
      super(data, beforeCursor, afterCursor, total);
    }
  }

  @GET
  @Operation(
      operationId = "listStorageService",
      summary = "List storage services",
      tags = "storageService",
      description =
          "Get a list of storage services. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of storage services",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = StorageServiceList.class)))
      })
  public ResultList<StorageService> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Limit number of services returned. (1 to 1000000, " + "default 10)")
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
          Include include)
      throws IOException {
    ListFilter filter = new ListFilter(include);
    return super.listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getStorageServiceByID",
      summary = "Get a storage service",
      tags = "storageService",
      description = "Get a storage service by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Storage service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = StorageService.class))),
        @ApiResponse(responseCode = "404", description = "Storage service for instance {id} is not found")
      })
  public StorageService get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") UUID id,
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

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchStorageService",
      summary = "Update a Storage Service",
      tags = "storageService",
      description = "Update an existing Storage Service using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response updateDescription(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("id") UUID id,
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

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getStorageServiceByFQN",
      summary = "Get storage service by name",
      tags = "storageService",
      description = "Get a storage service by the service `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Storage service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = StorageService.class))),
        @ApiResponse(responseCode = "404", description = "Storage service for instance {id} is not found")
      })
  public StorageService getByName(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("name") String name,
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
    return getByNameInternal(uriInfo, securityContext, name, fieldsParam, include);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllStorageServiceVersion",
      summary = "List storage service versions",
      tags = "storageService",
      description = "Get a list of all the versions of a storage service identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of storage service versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "storage service Id", schema = @Schema(type = "string")) @PathParam("id") UUID id)
      throws IOException {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificStorageServiceVersion",
      summary = "Get a version of the storage service",
      tags = "storageService",
      description = "Get a version of the storage service by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "storage service",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = StorageService.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Storage service for instance {id} and version " + "{version} is not found")
      })
  public StorageService getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "storage service Id", schema = @Schema(type = "string")) @PathParam("id") UUID id,
      @Parameter(
              description = "storage service version number in the form `major`" + ".`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createStorageService",
      summary = "Create storage service",
      tags = "storageService",
      description = "Create a new storage service.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Storage service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = StorageService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateStorageService create)
      throws IOException {
    StorageService service = getService(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, service, true);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateStorageService",
      summary = "Update storage service",
      tags = "storageService",
      description = "Update an existing storage service identified by `id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Storage service instance",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = StorageService.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateStorageService update)
      throws IOException {
    StorageService service = getService(update, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, service, true);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteStorageService",
      summary = "Delete a storage service",
      tags = "storageService",
      description = "Delete a storage services. If storages (and tables) belong the service, it can't be " + "deleted.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "StorageService service for instance {id} " + "is not found")
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
      @Parameter(description = "Id of the storage service", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException {
    return delete(uriInfo, securityContext, id, recursive, hardDelete, true);
  }

  private StorageService getService(CreateStorageService create, String user) throws IOException {
    return copy(new StorageService(), create, user).withServiceType(create.getServiceType());
  }
}
