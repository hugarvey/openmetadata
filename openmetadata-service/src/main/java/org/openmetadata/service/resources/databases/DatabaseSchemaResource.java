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

package org.openmetadata.service.resources.databases;

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
import org.openmetadata.schema.api.VoteRequest;
import org.openmetadata.schema.api.data.CreateDatabaseSchema;
import org.openmetadata.schema.api.data.RestoreEntity;
import org.openmetadata.schema.entity.data.DatabaseSchema;
import org.openmetadata.schema.type.*;
import org.openmetadata.schema.type.csv.CsvImportResult;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.DatabaseSchemaRepository;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.security.policyevaluator.OperationContext;
import org.openmetadata.service.util.ResultList;

@Path("/v1/databaseSchemas")
@Tag(
    name = "Database Schemas",
    description =
        "A `Database Schema` is collection of tables, views, stored procedures, and other database objects.")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "databaseSchemas")
public class DatabaseSchemaResource
    extends EntityResource<DatabaseSchema, DatabaseSchemaRepository> {
  public static final String COLLECTION_PATH = "v1/databaseSchemas/";
  static final String FIELDS = "owner,tables,usageSummary,tags,extension,domain,sourceHash";

  @Override
  public DatabaseSchema addHref(UriInfo uriInfo, DatabaseSchema schema) {
    super.addHref(uriInfo, schema);
    Entity.withHref(uriInfo, schema.getTables());
    Entity.withHref(uriInfo, schema.getService());
    Entity.withHref(uriInfo, schema.getDatabase());
    return schema;
  }

  public DatabaseSchemaResource(Authorizer authorizer) {
    super(Entity.DATABASE_SCHEMA, authorizer);
  }

  @Override
  protected List<MetadataOperation> getEntitySpecificOperations() {
    addViewOperation("tables", MetadataOperation.VIEW_BASIC);
    addViewOperation("usageSummary", MetadataOperation.VIEW_USAGE);
    return listOf(MetadataOperation.VIEW_USAGE, MetadataOperation.EDIT_USAGE);
  }

  public static class DatabaseSchemaList extends ResultList<DatabaseSchema> {
    /* Required for serde */
  }

  @GET
  @Operation(
      operationId = "listDBSchemas",
      summary = "List database schemas",
      description =
          "Get a list of database schemas, optionally filtered by `database` it belongs to. Use `fields` "
              + "parameter to get only necessary fields. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of database schema",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchemaList.class)))
      })
  public ResultList<DatabaseSchema> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(
              description = "Filter schemas by database name",
              schema = @Schema(type = "string", example = "customerDatabase"))
          @QueryParam("database")
          String databaseParam,
      @Parameter(description = "Limit the number schemas returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @QueryParam("limit")
          @Min(0)
          @Max(1000000)
          int limitParam,
      @Parameter(
              description = "Returns list of schemas before this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(
              description = "Returns list of schemas after this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include) {
    ListFilter filter = new ListFilter(include).addQueryParam("database", databaseParam);
    return listInternal(uriInfo, securityContext, fieldsParam, filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllDBSchemaVersion",
      summary = "List schema versions",
      description = "Get a list of all the versions of a schema identified by `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of schema versions",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Database schema Id", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getDBSchemaByID",
      summary = "Get a schema by Id",
      description = "Get a database schema by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The schema",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class))),
        @ApiResponse(responseCode = "404", description = "Schema for instance {id} is not found")
      })
  public DatabaseSchema get(
      @Context UriInfo uriInfo,
      @Parameter(description = "Database schema Id", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
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
          Include include) {
    return getInternal(uriInfo, securityContext, id, fieldsParam, include);
  }

  @GET
  @Path("/name/{fqn}")
  @Operation(
      operationId = "getDBSchemaByFQN",
      summary = "Get a schema by fully qualified name",
      description = "Get a database schema by fully qualified name.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The schema",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Database schema for instance {fqn} is not found")
      })
  public DatabaseSchema getByName(
      @Context UriInfo uriInfo,
      @Parameter(
              description = "Fully qualified name of the database schema",
              schema = @Schema(type = "string"))
          @PathParam("fqn")
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
          Include include) {
    return getByNameInternal(uriInfo, securityContext, fqn, fieldsParam, include);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificDBSchemaVersion",
      summary = "Get a version of the schema",
      description = "Get a version of the database schema by given `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "database schema",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Database schema for instance {id} and version {version} is not found")
      })
  public DatabaseSchema getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Database schema Id", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Parameter(
              description = "Database schema version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version) {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createDBSchema",
      summary = "Create a schema",
      description = "Create a schema under an existing `service`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The database schema",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateDatabaseSchema create) {
    DatabaseSchema schema = getDatabaseSchema(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, schema);
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchDBSchema",
      summary = "Update a database schema",
      description = "Update an existing database schema using JsonPatch.",
      externalDocs =
          @ExternalDocumentation(
              description = "JsonPatch RFC",
              url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Database schema Id", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[{op:remove, path:/a},{op:add, path: /b, value: val}]")
                      }))
          JsonPatch patch) {
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @PATCH
  @Path("/name/{fqn}")
  @Operation(
      operationId = "patchDBSchema",
      summary = "Update a database schema",
      description = "Update an existing database schema using JsonPatch.",
      externalDocs =
          @ExternalDocumentation(
              description = "JsonPatch RFC",
              url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Database schema name", schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[{op:remove, path:/a},{op:add, path: /b, value: val}]")
                      }))
          JsonPatch patch) {
    return patchInternal(uriInfo, securityContext, fqn, patch);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateDBSchema",
      summary = "Create or update schema",
      description =
          "Create a database schema, if it does not exist or update an existing database schema.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The updated schema ",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class)))
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateDatabaseSchema create) {
    DatabaseSchema schema = getDatabaseSchema(create, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, schema);
  }

  @GET
  @Path("/name/{name}/export")
  @Produces(MediaType.TEXT_PLAIN)
  @Valid
  @Operation(
      operationId = "exportDatabaseSchema",
      summary = "Export database schema in CSV format",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Exported csv with tables from the database schema",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = String.class)))
      })
  public String exportCsv(
      @Context SecurityContext securityContext,
      @Parameter(description = "Name of the Database schema", schema = @Schema(type = "string"))
          @PathParam("name")
          String name)
      throws IOException {
    return exportCsvInternal(securityContext, name);
  }

  @PUT
  @Path("/name/{name}/import")
  @Consumes(MediaType.TEXT_PLAIN)
  @Valid
  @Operation(
      operationId = "importDatabaseSchema",
      summary = "Import tables from CSV to update database schema (no creation allowed)",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Import result",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = CsvImportResult.class)))
      })
  public CsvImportResult importCsv(
      @Context SecurityContext securityContext,
      @Parameter(description = "Name of the Database schema", schema = @Schema(type = "string"))
          @PathParam("name")
          String name,
      @Parameter(
              description =
                  "Dry-run when true is used for validating the CSV without really importing it. (default=true)",
              schema = @Schema(type = "boolean"))
          @DefaultValue("true")
          @QueryParam("dryRun")
          boolean dryRun,
      String csv)
      throws IOException {
    return importCsvInternal(securityContext, name, csv, dryRun);
  }

  @PUT
  @Path("/{id}/vote")
  @Operation(
      operationId = "updateVoteForEntity",
      summary = "Update Vote for a Entity",
      description = "Update vote for a Entity",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "OK",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ChangeEvent.class))),
        @ApiResponse(responseCode = "404", description = "model for instance {id} is not found")
      })
  public Response updateVote(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the Entity", schema = @Schema(type = "UUID")) @PathParam("id")
          UUID id,
      @Valid VoteRequest request) {
    return repository
        .updateVote(securityContext.getUserPrincipal().getName(), id, request)
        .toResponse();
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteDBSchema",
      summary = "Delete a schema by Id",
      description = "Delete a schema by `Id`. Schema can only be deleted if it has no tables.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Schema for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Recursively delete this entity and it's children. (Default `false`)")
          @DefaultValue("false")
          @QueryParam("recursive")
          boolean recursive,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(description = "Database schema Id", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    return delete(uriInfo, securityContext, id, recursive, hardDelete);
  }

  @DELETE
  @Path("/name/{fqn}")
  @Operation(
      operationId = "deleteDBSchemaByFQN",
      summary = "Delete a schema by fully qualified name",
      description =
          "Delete a schema by `fullyQualifiedName`. Schema can only be deleted if it has no tables.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Schema for instance {fqn} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Hard delete the entity. (Default = `false`)")
          @QueryParam("hardDelete")
          @DefaultValue("false")
          boolean hardDelete,
      @Parameter(
              description = "Recursively delete this entity and it's children. (Default `false`)")
          @QueryParam("recursive")
          @DefaultValue("false")
          boolean recursive,
      @Parameter(description = "Name of the DBSchema", schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn) {
    return deleteByName(uriInfo, securityContext, fqn, recursive, hardDelete);
  }

  @PUT
  @Path("/restore")
  @Operation(
      operationId = "restore",
      summary = "Restore a soft deleted database schema.",
      description = "Restore a soft deleted database schema.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully restored the DatabaseSchema ",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class)))
      })
  public Response restoreDatabaseSchema(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid RestoreEntity restore) {
    return restoreEntity(uriInfo, securityContext, restore.getId());
  }

  @PUT
  @Path("/{id}/databaseSchemaProfilerConfig")
  @Operation(
      operationId = "addDataProfilerConfig",
      summary = "Add databaseSchema profile config",
      description = "Add databaseSchema profile config to the table.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully updated the DatabaseSchema ",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class)))
      })
  public DatabaseSchema addDataProfilerConfig(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the databaseSchema", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Valid DatabaseSchemaProfilerConfig databaseSchemaProfilerConfig) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.EDIT_DATA_PROFILE);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    DatabaseSchema databaseSchema =
        repository.addDatabaseSchemaProfilerConfig(id, databaseSchemaProfilerConfig);
    return addHref(uriInfo, databaseSchema);
  }

  @GET
  @Path("/{id}/databaseSchemaProfilerConfig")
  @Operation(
      operationId = "getDataProfilerConfig",
      summary = "Get databaseSchema profile config",
      description = "Get databaseSchema profile config to the table.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully updated the DatabaseSchema ",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class)))
      })
  public DatabaseSchema getDataProfilerConfig(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the databaseSchema", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.VIEW_DATA_PROFILE);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    DatabaseSchema databaseSchema = repository.find(id, Include.NON_DELETED);
    return addHref(
        uriInfo,
        databaseSchema.withDatabaseSchemaProfilerConfig(
            repository.getDatabaseSchemaProfilerConfig(databaseSchema)));
  }

  @DELETE
  @Path("/{id}/databaseSchemaProfilerConfig")
  @Operation(
      operationId = "delete DataProfilerConfig",
      summary = "Delete database profiler config",
      description = "delete database profile config to the database.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully deleted the Database profiler config",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = DatabaseSchema.class)))
      })
  public DatabaseSchema deleteDataProfilerConfig(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the table", schema = @Schema(type = "UUID")) @PathParam("id")
          UUID id) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.EDIT_DATA_PROFILE);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    DatabaseSchema databaseSchema = repository.deleteDatabaseSchemaProfilerConfig(id);
    return addHref(uriInfo, databaseSchema);
  }

  private DatabaseSchema getDatabaseSchema(CreateDatabaseSchema create, String user) {
    return repository
        .copy(new DatabaseSchema(), create, user)
        .withDatabase(getEntityReference(Entity.DATABASE, create.getDatabase()))
        .withSourceUrl(create.getSourceUrl())
        .withRetentionPeriod(create.getRetentionPeriod())
        .withSourceHash(create.getSourceHash());
  }
}
