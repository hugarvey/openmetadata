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

package org.openmetadata.service.resources.domains;

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
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.api.domains.CreateDomain;
import org.openmetadata.schema.entity.domains.Domain;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.DomainRepository;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.ResultList;

@Slf4j
@Path("/v1/domains")
@Tag(
    name = "Domains",
    description =
        "A `Domain` is a bounded context that is aligned with a Business Unit or a function within an organization.")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "domains", order = 4) // initialize after user resource
public class DomainResource extends EntityResource<Domain, DomainRepository> {
  public static final String COLLECTION_PATH = "/v1/domains/";
  static final String FIELDS = "children,owner,experts";

  public DomainResource(Authorizer authorizer) {
    super(Entity.DOMAIN, authorizer);
  }

  @Override
  public Domain addHref(UriInfo uriInfo, Domain domain) {
    super.addHref(uriInfo, domain);
    Entity.withHref(uriInfo, domain.getParent());
    return domain;
  }

  public static class DomainList extends ResultList<Domain> {
    @SuppressWarnings("unused")
    public DomainList() {
      /* Required for serde */
    }
  }

  @GET
  @Operation(
      operationId = "listDomains",
      summary = "List domains",
      description = "Get a list of Domains.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of Domains",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = DomainList.class)))
      })
  public ResultList<Domain> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @DefaultValue("10") @Min(0) @Max(1000000) @QueryParam("limit") int limitParam,
      @Parameter(description = "Returns list of Domain before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of Domain after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after) {
    return listInternal(uriInfo, securityContext, fieldsParam, new ListFilter(null), limitParam, before, after);
  }

  @GET
  @Path("/{id}")
  @Operation(
      operationId = "getDomainByID",
      summary = "Get a domain by Id",
      description = "Get a domain by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The domain",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Domain.class))),
        @ApiResponse(responseCode = "404", description = "Domain for instance {id} is not found")
      })
  public Domain get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Id of the domain", schema = @Schema(type = "UUID")) @PathParam("id") UUID id) {
    return getInternal(uriInfo, securityContext, id, fieldsParam, null);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getDomainByFQN",
      summary = "Get a domain by name",
      description = "Get a domain by `name`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "domain",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Domain.class))),
        @ApiResponse(responseCode = "404", description = "Domain for instance {name} is not found")
      })
  public Domain getByName(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Name of the domain", schema = @Schema(type = "string")) @PathParam("name") String name,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam) {
    return getByNameInternal(uriInfo, securityContext, name, fieldsParam, null);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllDomainVersion",
      summary = "List domain versions",
      description = "Get a list of all the versions of a domain identified by `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of domain versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the domain", schema = @Schema(type = "UUID")) @PathParam("id") UUID id) {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "listSpecificDomainVersion",
      summary = "Get a version of the domain",
      description = "Get a version of the domain by given `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "domain",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Domain.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Domain for instance {id} and version {version} is " + "not found")
      })
  public Domain getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the domain", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(
              description = "Domain version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version) {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createDomain",
      summary = "Create a domain",
      description = "Create a new domain.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The domain ",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Domain.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateDomain create) {
    Domain domain = getDomain(create, securityContext.getUserPrincipal().getName());
    return create(uriInfo, securityContext, domain);
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateDomain",
      summary = "Create or update a domain",
      description = "Create a domain. if it does not exist. If a domain already exists, update the domain.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The domain",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Domain.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateDomain create) {
    Domain domain = getDomain(create, securityContext.getUserPrincipal().getName());
    return createOrUpdate(uriInfo, securityContext, domain);
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchDomain",
      summary = "Update a domain",
      description = "Update an existing domain using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the domain", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[" + "{op:remove, path:/a}," + "{op:add, path: /b, value: val}" + "]")
                      }))
          JsonPatch patch) {
    return patchInternal(uriInfo, securityContext, id, patch);
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteDomain",
      summary = "Delete a domain by Id",
      description = "Delete a domain by `Id`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Domain for instance {id} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the domain", schema = @Schema(type = "UUID")) @PathParam("id") UUID id) {
    return delete(uriInfo, securityContext, id, true, true);
  }

  @DELETE
  @Path("/name/{name}")
  @Operation(
      operationId = "deleteDomainByFQN",
      summary = "Delete a domain by name",
      description = "Delete a domain by `name`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Domain for instance {name} is not found")
      })
  public Response delete(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Name of the domain", schema = @Schema(type = "string")) @PathParam("name")
          String name) {
    return deleteByName(uriInfo, securityContext, name, true, true);
  }

  private Domain getDomain(CreateDomain create, String user) {
    List<String> experts = create.getExperts();
    return repository
        .copy(new Domain(), create, user)
        .withStyle(create.getStyle())
        .withDomainType(create.getDomainType())
        .withFullyQualifiedName(create.getName())
        .withParent(
            Entity.getEntityReference(getEntityReference(Entity.DOMAIN, create.getParent()), Include.NON_DELETED))
        .withExperts(EntityUtil.populateEntityReferences(getEntityReferences(Entity.USER, experts)));
  }
}
