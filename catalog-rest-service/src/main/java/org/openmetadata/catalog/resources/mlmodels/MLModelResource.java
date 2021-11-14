/*
 *  Licensed to the Apache Software Foundation (ASF) under one or more
 *  contributor license agreements. See the NOTICE file distributed with
 *  this work for additional information regarding copyright ownership.
 *  The ASF licenses this file to You under the Apache License, Version 2.0
 *  (the "License"); you may not use this file except in compliance with
 *  the License. You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.catalog.resources.mlmodels;

import com.google.inject.Inject;
import io.swagger.annotations.Api;
import io.swagger.v3.oas.annotations.ExternalDocumentation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.openmetadata.catalog.api.data.CreateMLModel;
import org.openmetadata.catalog.entity.data.MLModel;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.jdbi3.CollectionDAO;
import org.openmetadata.catalog.jdbi3.MLModelRepository;
import org.openmetadata.catalog.resources.Collection;
import org.openmetadata.catalog.security.CatalogAuthorizer;
import org.openmetadata.catalog.security.SecurityUtil;
import org.openmetadata.catalog.util.EntityUtil.Fields;
import org.openmetadata.catalog.util.RestUtil;
import org.openmetadata.catalog.util.RestUtil.PutResponse;
import org.openmetadata.catalog.util.ResultList;

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
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.security.GeneralSecurityException;
import java.text.ParseException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Path("/v1/mlmodels")
@Api(value = "MLModels collection", tags = "MLModels collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "mlmodels")
public class MLModelResource {
  public static final String COLLECTION_PATH = "v1/mlmodels/";
  private final MLModelRepository dao;
  private final CatalogAuthorizer authorizer;

  public static List<MLModel> addHref(UriInfo uriInfo, List<MLModel> models) {
    Optional.ofNullable(models).orElse(Collections.emptyList()).forEach(i -> addHref(uriInfo, i));
    return models;
  }

  public static MLModel addHref(UriInfo uriInfo, MLModel mlmodel) {
    mlmodel.setHref(RestUtil.getHref(uriInfo, COLLECTION_PATH, mlmodel.getId()));
    Entity.withHref(uriInfo, mlmodel.getOwner());
    Entity.withHref(uriInfo, mlmodel.getDashboard()); // Dashboard HREF
    Entity.withHref(uriInfo, mlmodel.getFollowers());
    return mlmodel;
  }

  @Inject
  public MLModelResource(CollectionDAO dao, CatalogAuthorizer authorizer) {
    Objects.requireNonNull(dao, "ModelRepository must not be null");
    this.dao = new MLModelRepository(dao);
    this.authorizer = authorizer;
  }

  public static class MLModelList extends ResultList<MLModel> {
    @SuppressWarnings("unused")
    MLModelList() {
      // Empty constructor needed for deserialization
    }

    public MLModelList(List<MLModel> data, String beforeCursor, String afterCursor, int total)
            throws GeneralSecurityException, UnsupportedEncodingException {
      super(data, beforeCursor, afterCursor, total);
    }
  }

  static final String FIELDS = "owner,dashboard,algorithm,mlFeatures,mlHyperParameters,followers,tags,usageSummary";
  public static final List<String> FIELD_LIST = Arrays.asList(FIELDS.replaceAll(" ", "")
          .split(","));

  @GET
  @Valid
  @Operation(summary = "List ML Models", tags = "mlModels",
          description = "Get a list of ML Models. Use `fields` parameter to get only necessary fields. " +
                  " Use cursor-based pagination to limit the number " +
                  "entries in the list using `limit` and `before` or `after` query params.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "List of models",
                               content = @Content(mediaType = "application/json",
                                       schema = @Schema(implementation = MLModelList.class)))
          })
  public ResultList<MLModel> list(@Context UriInfo uriInfo,
                                      @Context SecurityContext securityContext,
                                      @Parameter(description = "Fields requested in the returned resource",
                                              schema = @Schema(type = "string", example = FIELDS))
                                      @QueryParam("fields") String fieldsParam,
                                      @Parameter(description = "Limit the number models returned. (1 to 1000000, " +
                                              "default = 10)")
                                      @DefaultValue("10")
                                      @Min(1)
                                      @Max(1000000)
                                      @QueryParam("limit") int limitParam,
                                      @Parameter(description = "Returns list of models before this cursor",
                                              schema = @Schema(type = "string"))
                                      @QueryParam("before") String before,
                                      @Parameter(description = "Returns list of models after this cursor",
                                              schema = @Schema(type = "string"))
                                      @QueryParam("after") String after
  ) throws IOException, GeneralSecurityException, ParseException {
    RestUtil.validateCursors(before, after);
    Fields fields = new Fields(FIELD_LIST, fieldsParam);

    ResultList<MLModel> mlmodels;
    if (before != null) { // Reverse paging
      mlmodels = dao.listBefore(uriInfo, fields, null, limitParam, before); // Ask for one extra entry
    } else { // Forward paging or first page
      mlmodels = dao.listAfter(uriInfo, fields, null, limitParam, after);
    }
    addHref(uriInfo, mlmodels.getData());
    return mlmodels;
  }

  @GET
  @Path("/{id}")
  @Operation(summary = "Get an ML Model", tags = "mlModels",
          description = "Get an ML Model by `id`.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "The model",
                          content = @Content(mediaType = "application/json",
                          schema = @Schema(implementation = MLModel.class))),
                  @ApiResponse(responseCode = "404", description = "Model for instance {id} is not found")
          })
  public MLModel get(@Context UriInfo uriInfo,
                       @Context SecurityContext securityContext,
                       @PathParam("id") String id,
                       @Parameter(description = "Fields requested in the returned resource",
                               schema = @Schema(type = "string", example = FIELDS))
                       @QueryParam("fields") String fieldsParam) throws IOException, ParseException {
    Fields fields = new Fields(FIELD_LIST, fieldsParam);
    return addHref(uriInfo, dao.get(uriInfo, id, fields));
  }

  @GET
  @Path("/name/{fqn}")
  @Operation(summary = "Get an ML Model by name", tags = "mlModels",
          description = "Get an ML Model by fully qualified name.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "The model",
                          content = @Content(mediaType = "application/json",
                                  schema = @Schema(implementation = MLModel.class))),
                  @ApiResponse(responseCode = "404", description = "Model for instance {id} is not found")
          })
  public MLModel getByName(@Context UriInfo uriInfo, @PathParam("fqn") String fqn,
                            @Context SecurityContext securityContext,
                            @Parameter(description = "Fields requested in the returned resource",
                                    schema = @Schema(type = "string", example = FIELDS))
                            @QueryParam("fields") String fieldsParam) throws IOException, ParseException {
    Fields fields = new Fields(FIELD_LIST, fieldsParam);
    MLModel mlmodel = dao.getByName(uriInfo, fqn, fields);
    return addHref(uriInfo, mlmodel);
  }


  @POST
  @Operation(summary = "Create an ML Model", tags = "mlModels",
          description = "Create a new ML Model.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "The model",
                          content = @Content(mediaType = "application/json",
                          schema = @Schema(implementation = CreateMLModel.class))),
                  @ApiResponse(responseCode = "400", description = "Bad request")
          })
  public Response create(@Context UriInfo uriInfo, @Context SecurityContext securityContext,
                         @Valid CreateMLModel create) throws IOException, ParseException {
    SecurityUtil.checkAdminOrBotRole(authorizer, securityContext);
    MLModel mlModel = getMLModel(securityContext, create);
    mlModel = addHref(uriInfo, dao.create(uriInfo, mlModel));
    return Response.created(mlModel.getHref()).entity(mlModel).build();
  }

  @PATCH
  @Path("/{id}")
  @Operation(summary = "Update an ML Model", tags = "mlModels",
          description = "Update an existing ML Model using JsonPatch.",
          externalDocs = @ExternalDocumentation(description = "JsonPatch RFC",
                  url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public MLModel updateDescription(@Context UriInfo uriInfo,
                                     @Context SecurityContext securityContext,
                                     @PathParam("id") String id,
                                     @RequestBody(description = "JsonPatch with array of operations",
                                         content = @Content(mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                                                 examples = {@ExampleObject("[" +
                                                         "{op:remove, path:/a}," +
                                                         "{op:add, path: /b, value: val}" +
                                                         "]")}))
                                         JsonPatch patch) throws IOException, ParseException {
    Fields fields = new Fields(FIELD_LIST, FIELDS);
    MLModel mlModel = dao.get(uriInfo, id, fields);
    SecurityUtil.checkAdminRoleOrPermissions(authorizer, securityContext,
            dao.getOwnerReference(mlModel));
    mlModel = dao.patch(uriInfo, UUID.fromString(id), securityContext.getUserPrincipal().getName(), patch);
    return addHref(uriInfo, mlModel);
  }

  @PUT
  @Operation(summary = "Create or update an ML Model", tags = "mlModels",
          description = "Create a new ML Model, if it does not exist or update an existing model.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "The model",
                          content = @Content(mediaType = "application/json",
                          schema = @Schema(implementation = MLModel.class))),
                  @ApiResponse(responseCode = "400", description = "Bad request")
          })
  public Response createOrUpdate(@Context UriInfo uriInfo,
                                 @Context SecurityContext securityContext,
                                 @Valid CreateMLModel create) throws IOException, ParseException {
    MLModel mlModel = getMLModel(securityContext, create);
    PutResponse<MLModel> response = dao.createOrUpdate(uriInfo, mlModel);
    addHref(uriInfo, response.getEntity());
    return response.toResponse();
  }

  @PUT
  @Path("/{id}/followers")
  @Operation(summary = "Add a follower", tags = "mlModels",
          description = "Add a user identified by `userId` as follower of this model",
          responses = {
                  @ApiResponse(responseCode = "200", description = "OK"),
                  @ApiResponse(responseCode = "404", description = "model for instance {id} is not found")
          })
  public Response addFollower(@Context UriInfo uriInfo,
                              @Context SecurityContext securityContext,
                              @Parameter(description = "Id of the model", schema = @Schema(type = "string"))
                              @PathParam("id") String id,
                              @Parameter(description = "Id of the user to be added as follower",
                                      schema = @Schema(type = "string"))
                                      String userId) throws IOException, ParseException {
      return dao.addFollower(securityContext.getUserPrincipal().getName(), UUID.fromString(id),
              UUID.fromString(userId)).toResponse();
  }

  @DELETE
  @Path("/{id}/followers/{userId}")
  @Operation(summary = "Remove a follower", tags = "mlModels",
          description = "Remove the user identified `userId` as a follower of the model.")
  public Response deleteFollower(@Context UriInfo uriInfo,
                              @Context SecurityContext securityContext,
                              @Parameter(description = "Id of the model",
                                      schema = @Schema(type = "string"))
                              @PathParam("id") String id,
                                 @Parameter(description = "Id of the user being removed as follower",
                                      schema = @Schema(type = "string"))
                              @PathParam("userId") String userId) throws IOException, ParseException {
    return dao.deleteFollower(securityContext.getUserPrincipal().getName(), UUID.fromString(id),
            UUID.fromString(userId)).toResponse();
  }

  @DELETE
  @Path("/{id}")
  @Operation(summary = "Delete an ML Model", tags = "mlModels",
          description = "Delete an ML Model by `id`.",
          responses = {
                  @ApiResponse(responseCode = "200", description = "OK"),
                  @ApiResponse(responseCode = "404", description = "model for instance {id} is not found")
          })
  public Response delete(@Context UriInfo uriInfo, @PathParam("id") String id) {
    dao.delete(UUID.fromString(id));
    return Response.ok().build();
  }

  private MLModel getMLModel(SecurityContext securityContext, CreateMLModel create) {
    return new MLModel().withId(UUID.randomUUID()).withName(create.getName())
              .withDisplayName(create.getDisplayName())
              .withDescription(create.getDescription())
              .withDashboard(create.getDashboard())
              .withAlgorithm(create.getAlgorithm())
              .withMlFeatures(create.getMlFeatures())
              .withMlHyperParameters(create.getMlHyperParameters())
              .withTags(create.getTags())
              .withOwner(create.getOwner())
              .withUpdatedBy(securityContext.getUserPrincipal().getName())
              .withUpdatedAt(new Date());
  }
}
