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

package org.openmetadata.service.resources.alerts;

import static org.openmetadata.schema.settings.SettingsType.ACTIVITY_FEED_FILTER_SETTING;

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
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.api.events.CreateAlert;
import org.openmetadata.schema.entity.alerts.Alert;
import org.openmetadata.schema.entity.alerts.AlertActionStatus;
import org.openmetadata.schema.filter.EventFilter;
import org.openmetadata.schema.settings.Settings;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Function;
import org.openmetadata.schema.type.Include;
import org.openmetadata.service.FunctionList;
import org.openmetadata.service.OpenMetadataApplicationConfig;
import org.openmetadata.service.alerts.AlertUtil;
import org.openmetadata.service.jdbi3.AlertRepository;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.resources.settings.SettingsResource;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.FilterUtil;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.ResultList;

@Slf4j
@Path("/v1/alerts")
@Api(value = "Alerts collection", tags = "Alerts collection")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "alerts", order = 8) // init after alertAction Resource
public class AlertResource extends EntityResource<Alert, AlertRepository> {
  public static final String COLLECTION_PATH = "v1/alerts/";
  private final CollectionDAO.AlertDAO alertDAO;
  private List<EventFilter> bootStrappedFilters;

  private void initDefaultTriggersSettings() throws IOException {
    List<String> jsonDataFiles = EntityUtil.getJsonDataResources(".*json/data/settings/settingsData.json$");
    if (jsonDataFiles.size() != 1) {
      LOG.warn("Invalid number of jsonDataFiles {}. Only one expected.", jsonDataFiles.size());
      return;
    }
    String jsonDataFile = jsonDataFiles.get(0);
    try {
      String json = CommonUtil.getResourceAsStream(getClass().getClassLoader(), jsonDataFile);
      List<Settings> settings = JsonUtils.readObjects(json, Settings.class);
      settings.forEach(
          (setting) -> {
            try {
              if (setting.getConfigType() == ACTIVITY_FEED_FILTER_SETTING) {
                bootStrappedFilters = FilterUtil.getEventFilterFromSettings(setting);
              }
            } catch (IOException e) {
              LOG.debug("Default Filter Init failed ", e);
            }
          });
    } catch (Exception e) {
      LOG.warn("Failed to initialize the {} from file {}", "filters", jsonDataFile, e);
    }
  }

  @Override
  public Alert addHref(UriInfo uriInfo, Alert entity) {
    return entity;
  }

  public AlertResource(CollectionDAO dao, Authorizer authorizer) {
    super(Alert.class, new AlertRepository(dao), authorizer);
    alertDAO = dao.alertDAO();
  }

  public static class AlertList extends ResultList<Alert> {

    @SuppressWarnings("unused") /* Required for tests */
    public AlertList() {}
  }

  @Override
  public void initialize(OpenMetadataApplicationConfig config) {
    try {
      List<String> listAllAlerts = alertDAO.listAllAlerts(alertDAO.getTableName());
      List<Alert> alertList = JsonUtils.readObjects(listAllAlerts, Alert.class);
      for (Alert alert : alertList) {
        dao.addAlertActionPublishers(alert);
      }
      initDefaultTriggersSettings();
    } catch (Exception ex) {
      // Starting application should not fail
      LOG.warn("Exception during initialization", ex);
    }
  }

  @GET
  @Operation(
      operationId = "listAlerts",
      summary = "List alerts",
      tags = "alerts",
      description = "Get a list of alerts subscriptions",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of alerts",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = AlertResource.AlertList.class)))
      })
  public ResultList<Alert> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Filter alerts by status", schema = @Schema(type = "string", example = "active"))
          @QueryParam("status")
          String statusParam,
      @Parameter(
              description = "Filter alerts by type",
              schema = @Schema(type = "string", example = "generic, slack, msteams"))
          @QueryParam("alertType")
          String typeParam,
      @Parameter(description = "Limit the number alerts returned. (1 to 1000000, default = " + "10) ")
          @DefaultValue("10")
          @Min(0)
          @Max(1000000)
          @QueryParam("limit")
          int limitParam,
      @Parameter(description = "Returns list of alerts before this cursor", schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(description = "Returns list of alerts after this cursor", schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    ListFilter filter =
        new ListFilter(Include.ALL).addQueryParam("status", statusParam).addQueryParam("alertType", typeParam);
    return listInternal(uriInfo, securityContext, "", filter, limitParam, before, after);
  }

  @GET
  @Path("/{id}")
  @Valid
  @Operation(
      operationId = "getAlertByID",
      summary = "Get a alert",
      tags = "alerts",
      description = "Get a alert by given Id",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Entity events",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Alert.class))),
        @ApiResponse(responseCode = "404", description = "Entity for instance {id} is not found")
      })
  public Alert get(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "alert Id", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    return getInternal(uriInfo, securityContext, id, "", include);
  }

  @GET
  @Path("/{alertId}/status/{actionId}")
  @Valid
  @Operation(
      operationId = "getAlertActionStatus",
      summary = "Get a alert Action status",
      tags = "alerts",
      description = "Get a alert actions status by given Id",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Entity events",
            content =
                @Content(mediaType = "application/json", schema = @Schema(implementation = AlertActionStatus.class))),
        @ApiResponse(responseCode = "404", description = "Entity for instance {id} is not found")
      })
  public AlertActionStatus getActionStatus(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "alert Id", schema = @Schema(type = "UUID")) @PathParam("alertId") UUID alertId,
      @Parameter(description = "alertAction Id", schema = @Schema(type = "UUID")) @PathParam("alertId")
          UUID alertActionId)
      throws IOException {
    return dao.getAlertActionStatus(alertId, alertActionId);
  }

  @GET
  @Path("/defaultTriggers")
  @Operation(
      operationId = "defaultTriggers",
      summary = "List All Default Triggers Config",
      tags = "alerts",
      description = "Get a List of all OpenMetadata Bootstrapped Filters",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of Settings",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = SettingsResource.SettingsList.class)))
      })
  public List<EventFilter> getBootstrapFilters(@Context UriInfo uriInfo, @Context SecurityContext securityContext) {
    authorizer.authorizeAdmin(securityContext);
    return bootStrappedFilters;
  }

  @GET
  @Path("/functions")
  @Operation(
      operationId = "listAlertFunctions",
      summary = "Get list of Alert functions used in filtering alert.",
      tags = "alerts",
      description = "Get list of Alert functions used in filtering conditions in alerts")
  public ResultList<Function> listAlertFunctions(@Context UriInfo uriInfo, @Context SecurityContext securityContext) {
    return new FunctionList(AlertUtil.getAlertFilterFunctions());
  }

  @GET
  @Path("/validation/condition/{expression}")
  @Operation(
      operationId = "validateCondition",
      summary = "Validate a given condition",
      tags = "policies",
      description = "Validate a given condition expression used in filtering rules.",
      responses = {
        @ApiResponse(responseCode = "204", description = "No value is returned"),
        @ApiResponse(responseCode = "400", description = "Invalid expression")
      })
  public void validateCondition(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @PathParam("expression") String expression) {
    AlertUtil.validateExpression(expression, Boolean.class);
  }

  @GET
  @Path("/name/{name}")
  @Operation(
      operationId = "getAlertByFQN",
      summary = "Get a alert by name",
      tags = "alerts",
      description = "Get a alert by name.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "alert",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Alert.class))),
        @ApiResponse(responseCode = "404", description = "Alert for instance {id} is not found")
      })
  public Alert getByName(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Name of the alert", schema = @Schema(type = "string")) @PathParam("name") String name,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include)
      throws IOException {
    return getByNameInternal(uriInfo, securityContext, name, "", include);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllAlertVersion",
      summary = "List alert versions",
      tags = "alerts",
      description = "Get a list of all the versions of a alert identified by `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of alert versions",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "alert Id", schema = @Schema(type = "string")) @PathParam("id") UUID id)
      throws IOException {
    return super.listVersionsInternal(securityContext, id);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificAlertVersion",
      summary = "Get a version of the alert",
      tags = "alerts",
      description = "Get a version of the alert by given `id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "alert",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Alert.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Alert for instance {id} and version {version} is " + "not found")
      })
  public Alert getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "alert Id", schema = @Schema(type = "UUID")) @PathParam("id") UUID id,
      @Parameter(
              description = "alert version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version)
      throws IOException {
    return super.getVersionInternal(securityContext, id, version);
  }

  @POST
  @Operation(
      operationId = "createAlert",
      summary = "Subscribe to a new alert",
      tags = "alerts",
      description = "Subscribe to a new alert",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "alert",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = CreateAlert.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response createAlert(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateAlert create)
      throws IOException {
    Alert alert = getAlert(create, securityContext.getUserPrincipal().getName());
    Response response = create(uriInfo, securityContext, alert);
    dao.addAlertActionPublishers(alert);
    return response;
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateAlert",
      summary = "Updated an existing or create a new Alert",
      tags = "alerts",
      description = "Updated an existing or create a new alert",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "alert",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = CreateAlert.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response updateAlert(
      @Context UriInfo uriInfo, @Context SecurityContext securityContext, @Valid CreateAlert create)
      throws IOException {
    Alert alert = getAlert(create, securityContext.getUserPrincipal().getName());
    Response response = createOrUpdate(uriInfo, securityContext, alert);
    dao.updateAlertActionPublishers((Alert) response.getEntity());
    return response;
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchAlert",
      summary = "Update a Alert",
      tags = "alerts",
      description = "Update an existing alert using JsonPatch.",
      externalDocs = @ExternalDocumentation(description = "JsonPatch RFC", url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
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
    Response response = patchInternal(uriInfo, securityContext, id, patch);
    dao.updateAlertActionPublishers((Alert) response.getEntity());
    return response;
  }

  @DELETE
  @Path("/{id}")
  @Valid
  @Operation(
      operationId = "deleteAlert",
      summary = "Delete a Alert",
      tags = "alerts",
      description = "Get a alert by given Id",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Entity events",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Alert.class))),
        @ApiResponse(responseCode = "404", description = "Entity for instance {id} is not found")
      })
  public Response deleteAlert(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "alert Id", schema = @Schema(type = "UUID")) @PathParam("id") UUID id)
      throws IOException, InterruptedException {
    Response response = delete(uriInfo, securityContext, id, false, true);
    dao.deleteAlertAllPublishers(id);
    return response;
  }

  public Alert getAlert(CreateAlert create, String user) throws IOException {
    return copy(new Alert(), create, user)
        .withTriggerConfig(create.getTriggerConfig())
        .withFilteringRules(create.getFilteringRules())
        .withAlertActions(create.getAlertActions());
  }
}
