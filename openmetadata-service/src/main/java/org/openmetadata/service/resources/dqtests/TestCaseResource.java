package org.openmetadata.service.resources.dqtests;

import static org.openmetadata.common.utils.CommonUtil.nullOrEmpty;
import static org.openmetadata.schema.type.EventType.ENTITY_NO_CHANGE;
import static org.openmetadata.schema.type.Include.ALL;

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
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.api.data.RestoreEntity;
import org.openmetadata.schema.api.tests.CreateLogicalTestCases;
import org.openmetadata.schema.api.tests.CreateTestCase;
import org.openmetadata.schema.entity.teams.User;
import org.openmetadata.schema.tests.TestCase;
import org.openmetadata.schema.tests.TestSuite;
import org.openmetadata.schema.tests.type.TestCaseResult;
import org.openmetadata.schema.tests.type.TestCaseStatus;
import org.openmetadata.schema.type.EntityHistory;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.MetadataOperation;
import org.openmetadata.schema.type.TableData;
import org.openmetadata.service.Entity;
import org.openmetadata.service.jdbi3.Filter;
import org.openmetadata.service.jdbi3.ListFilter;
import org.openmetadata.service.jdbi3.TestCaseRepository;
import org.openmetadata.service.limits.Limits;
import org.openmetadata.service.resources.Collection;
import org.openmetadata.service.resources.EntityResource;
import org.openmetadata.service.resources.feeds.MessageParser.EntityLink;
import org.openmetadata.service.search.SearchListFilter;
import org.openmetadata.service.search.SearchSortFilter;
import org.openmetadata.service.security.Authorizer;
import org.openmetadata.service.security.mask.PIIMasker;
import org.openmetadata.service.security.policyevaluator.CreateResourceContext;
import org.openmetadata.service.security.policyevaluator.OperationContext;
import org.openmetadata.service.security.policyevaluator.ResourceContext;
import org.openmetadata.service.security.policyevaluator.ResourceContextInterface;
import org.openmetadata.service.security.policyevaluator.TestCaseResourceContext;
import org.openmetadata.service.util.EntityUtil.Fields;
import org.openmetadata.service.util.RestUtil;
import org.openmetadata.service.util.RestUtil.DeleteResponse;
import org.openmetadata.service.util.RestUtil.PatchResponse;
import org.openmetadata.service.util.RestUtil.PutResponse;
import org.openmetadata.service.util.ResultList;

@Slf4j
@Path("/v1/dataQuality/testCases")
@Tag(
    name = "Test Cases",
    description =
        "Test case is a test definition to capture data quality tests against tables,"
            + " columns, and other data assets.")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Collection(name = "TestCases")
public class TestCaseResource extends EntityResource<TestCase, TestCaseRepository> {
  public static final String COLLECTION_PATH = "/v1/dataQuality/testCases";

  static final String FIELDS = "owners,testSuite,testDefinition,testSuites,incidentId,domain,tags";
  static final String SEARCH_FIELDS_EXCLUDE =
      "testPlatforms,table,database,databaseSchema,service,testSuite,dataQualityDimension,testCaseType";

  @Override
  public TestCase addHref(UriInfo uriInfo, TestCase test) {
    super.addHref(uriInfo, test);
    Entity.withHref(uriInfo, test.getTestSuite());
    Entity.withHref(uriInfo, test.getTestDefinition());
    return test;
  }

  public TestCaseResource(Authorizer authorizer, Limits limits) {
    super(Entity.TEST_CASE, authorizer, limits);
  }

  @Override
  protected List<MetadataOperation> getEntitySpecificOperations() {
    addViewOperation("testSuite,testDefinition", MetadataOperation.VIEW_BASIC);
    return null;
  }

  public static class TestCaseList extends ResultList<TestCase> {
    /* Required for serde */
  }

  public static class TestCaseResultList extends ResultList<TestCaseResult> {
    /* Required for serde */
  }

  @GET
  @Operation(
      operationId = "listTestCases",
      summary = "List test cases",
      description =
          "Get a list of test. Use `fields` "
              + "parameter to get only necessary fields. Use cursor-based pagination to limit the number "
              + "entries in the list using `limit` and `before` or `after` query params."
              + "Use the `testSuite` field to get the executable Test Suite linked to this test case "
              + "or use the `testSuites` field to list test suites (executable and logical) linked.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of test definitions",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCaseResource.TestCaseList.class)))
      })
  public ResultList<TestCase> list(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Limit the number tests returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @QueryParam("limit")
          @Min(0)
          @Max(1000000)
          int limitParam,
      @Parameter(
              description = "Returns list of tests before this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("before")
          String before,
      @Parameter(
              description = "Returns list of tests after this cursor",
              schema = @Schema(type = "string"))
          @QueryParam("after")
          String after,
      @Parameter(
              description = "Return list of tests by entity link",
              schema =
                  @Schema(type = "string", example = "<E#/{entityType}/{entityFQN}/{fieldName}>"))
          @QueryParam("entityLink")
          String entityLink,
      @Parameter(
              description = "Returns list of tests filtered by the testSuite id",
              schema = @Schema(type = "string"))
          @QueryParam("testSuiteId")
          String testSuiteId,
      @Parameter(
              description = "Include all the tests at the entity level",
              schema = @Schema(type = "boolean"))
          @QueryParam("includeAllTests")
          @DefaultValue("false")
          Boolean includeAllTests,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include,
      @Parameter(
              description = "Filter test case by status",
              schema =
                  @Schema(
                      type = "string",
                      allowableValues = {"Success", "Failed", "Aborted", "Queued"}))
          @QueryParam("testCaseStatus")
          String status,
      @Parameter(
              description = "Filter for test case type (e.g. column, table, all",
              schema =
                  @Schema(
                      type = "string",
                      allowableValues = {"column", "table", "all"}))
          @QueryParam("testCaseType")
          @DefaultValue("all")
          String type) {
    ListFilter filter =
        new ListFilter(include)
            .addQueryParam("testSuiteId", testSuiteId)
            .addQueryParam("includeAllTests", includeAllTests.toString())
            .addQueryParam("testCaseStatus", status)
            .addQueryParam("testCaseType", type);
    ResourceContextInterface resourceContext = getResourceContext(entityLink, filter);

    // Override OperationContext to change the entity to table and operation from VIEW_ALL to
    // VIEW_TESTS
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.VIEW_TESTS);
    Fields fields = getFields(fieldsParam);

    ResultList<TestCase> tests =
        super.listInternal(
            uriInfo,
            securityContext,
            fields,
            filter,
            limitParam,
            before,
            after,
            operationContext,
            resourceContext);
    return PIIMasker.getTestCases(tests, authorizer, securityContext);
  }

  @GET
  @Path("/search/list")
  @Operation(
      operationId = "listTestCasesFromSearchService",
      summary = "List test cases using search service",
      description =
          "Get a list of test cases using the search service. Use `fields` "
              + "parameter to get only necessary fields. Use offset/limit pagination to limit the number "
              + "entries in the list using `limit` and `offset` query params."
              + "Use the `testSuite` field to get the executable Test Suite linked to this test case "
              + "or use the `testSuites` field to list test suites (executable and logical) linked.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of test cases",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCaseResource.TestCaseList.class)))
      })
  public ResultList<TestCase> listFromSearch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fields requested in the returned resource",
              schema = @Schema(type = "string", example = FIELDS))
          @QueryParam("fields")
          String fieldsParam,
      @Parameter(description = "Limit the number tests returned. (1 to 1000000, default = 10)")
          @DefaultValue("10")
          @QueryParam("limit")
          @Min(0)
          @Max(1000000)
          int limit,
      @Parameter(
              description = "Returns list of tests after this offset",
              schema = @Schema(type = "string"))
          @QueryParam("offset")
          @DefaultValue("0")
          @Min(0)
          int offset,
      @Parameter(
              description = "Return list of tests by entity link",
              schema =
                  @Schema(type = "string", example = "<E#/{entityType}/{entityFQN}/{fieldName}>"))
          @QueryParam("entityLink")
          String entityLink,
      @Parameter(
              description = "Returns list of tests filtered by a testSuite id",
              schema = @Schema(type = "string"))
          @QueryParam("testSuiteId")
          String testSuiteId,
      @Parameter(
              description = "Include all the tests at the entity level",
              schema = @Schema(type = "boolean"))
          @QueryParam("includeAllTests")
          @DefaultValue("false")
          Boolean includeAllTests,
      @Parameter(
              description = "Include all, deleted, or non-deleted entities.",
              schema = @Schema(implementation = Include.class))
          @QueryParam("include")
          @DefaultValue("non-deleted")
          Include include,
      @Parameter(
              description = "Filter test case by status",
              schema =
                  @Schema(
                      type = "string",
                      allowableValues = {"Success", "Failed", "Aborted", "Queued"}))
          @QueryParam("testCaseStatus")
          String status,
      @Parameter(
              description = "Filter for test case type (e.g. column, table, all)",
              schema =
                  @Schema(
                      type = "string",
                      allowableValues = {"column", "table", "all"}))
          @QueryParam("testCaseType")
          @DefaultValue("all")
          String type,
      @Parameter(
              description = "Filter for test case by source (e.g. OpenMetadata, dbt, etc.)",
              schema = @Schema(type = "string"))
          @QueryParam("testPlatforms")
          String testPlatforms,
      @Parameter(
              description =
                  "Filter for test case by data quality dimension (e.g. OpenMetadata, dbt, etc.)",
              schema = @Schema(type = "string"))
          @QueryParam("dataQualityDimension")
          String dataQualityDimension,
      @Parameter(
              description =
                  "Parameter used to filter (inclusive) the test cases by the last execution timestamp (in milliseconds). Must be used in conjunction with `endTimestamp`",
              schema = @Schema(type = "long"))
          @QueryParam("startTimestamp")
          Long startTimestamp,
      @Parameter(
              description =
                  "Parameter used to filter (inclusive) the test cases by the last execution timestamp (in milliseconds). Must be used in conjunction with `startTimestamp`",
              schema = @Schema(type = "long"))
          @QueryParam("endTimestamp")
          Long endTimestamp,
      @Parameter(
              description = "Field used to sort the test cases listing",
              schema = @Schema(type = "string"))
          @QueryParam("sortField")
          String sortField,
      @Parameter(
              description =
                  "Set this field if your mapping is nested and you want to sort on a nested field",
              schema = @Schema(type = "string"))
          @QueryParam("sortNestedPath")
          String sortNestedPath,
      @Parameter(
              description =
                  "Set this field if your mapping is nested and you want to sort on a nested field",
              schema = @Schema(type = "string", example = "min,max,avg,sum,median"))
          @QueryParam("sortNestedMode")
          String sortNestedMode,
      @Parameter(
              description = "Sort type",
              schema =
                  @Schema(
                      type = "string",
                      allowableValues = {"asc", "desc"}))
          @QueryParam("sortType")
          @DefaultValue("desc")
          String sortType,
      @Parameter(
              description = "Return only required fields in the response",
              schema = @Schema(type = "string"))
          @QueryParam("includeFields")
          String includeFields,
      @Parameter(description = "domain filter to use in list", schema = @Schema(type = "string"))
          @QueryParam("domain")
          String domain,
      @Parameter(description = "owner filter to use in list", schema = @Schema(type = "string"))
          @QueryParam("owner")
          String owner,
      @Parameter(description = "tags filter to use in list", schema = @Schema(type = "string"))
          @QueryParam("tags")
          String tags,
      @Parameter(description = "tier filter to use in list", schema = @Schema(type = "string"))
          @QueryParam("tier")
          String tier,
      @Parameter(description = "service filter to use in list", schema = @Schema(type = "string"))
          @QueryParam("serviceName")
          String serviceName,
      @Parameter(
              description = "search query term to use in list",
              schema = @Schema(type = "string"))
          @QueryParam("q")
          String q)
      throws IOException {
    if ((startTimestamp == null && endTimestamp != null)
        || (startTimestamp != null && endTimestamp == null)) {
      throw new IllegalArgumentException("startTimestamp and endTimestamp must be used together");
    }
    SearchSortFilter searchSortFilter =
        new SearchSortFilter(sortField, sortType, sortNestedPath, sortNestedMode);
    SearchListFilter searchListFilter = new SearchListFilter(include);
    searchListFilter.addQueryParam("testSuiteId", testSuiteId);
    searchListFilter.addQueryParam("includeAllTests", includeAllTests.toString());
    searchListFilter.addQueryParam("testCaseStatus", status);
    searchListFilter.addQueryParam("testCaseType", type);
    searchListFilter.addQueryParam("testPlatforms", testPlatforms);
    searchListFilter.addQueryParam("dataQualityDimension", dataQualityDimension);
    searchListFilter.addQueryParam("q", q);
    searchListFilter.addQueryParam("excludeFields", SEARCH_FIELDS_EXCLUDE);
    searchListFilter.addQueryParam("includeFields", includeFields);
    searchListFilter.addQueryParam("domain", domain);
    searchListFilter.addQueryParam("tags", tags);
    searchListFilter.addQueryParam("tier", tier);
    searchListFilter.addQueryParam("serviceName", serviceName);
    if (!nullOrEmpty(owner)) {
      EntityInterface entity;
      StringBuffer owners = new StringBuffer();
      try {
        User user = (User) Entity.getEntityByName(Entity.USER, owner, "teams", ALL);
        owners.append(user.getId().toString());
        if (!nullOrEmpty(user.getTeams())) {
          owners
              .append(",")
              .append(
                  user.getTeams().stream()
                      .map(t -> t.getId().toString())
                      .collect(Collectors.joining(",")));
        }
      } catch (Exception e) {
        // If the owner is not a user, then we'll try to get team
        entity = Entity.getEntityByName(Entity.TEAM, owner, "", ALL);
        owners.append(entity.getId().toString());
      }
      searchListFilter.addQueryParam("owners", owners.toString());
    }

    if (startTimestamp != null) {
      if (startTimestamp > endTimestamp) {
        throw new IllegalArgumentException("startTimestamp must be less than endTimestamp");
      }
      searchListFilter.addQueryParam("startTimestamp", startTimestamp.toString());
      searchListFilter.addQueryParam("endTimestamp", endTimestamp.toString());
    }

    ResourceContextInterface resourceContextInterface =
        getResourceContext(entityLink, searchListFilter);
    // Override OperationContext to change the entity to table and operation from VIEW_ALL to
    // VIEW_TESTS
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.VIEW_TESTS);
    Fields fields = getFields(fieldsParam);

    ResultList<TestCase> tests =
        super.listInternalFromSearch(
            uriInfo,
            securityContext,
            fields,
            searchListFilter,
            limit,
            offset,
            searchSortFilter,
            q,
            operationContext,
            resourceContextInterface);
    return PIIMasker.getTestCases(tests, authorizer, securityContext);
  }

  @GET
  @Path("/{id}/versions")
  @Operation(
      operationId = "listAllTestCaseVersion",
      summary = "List test case versions",
      description = "Get a list of all the versions of a testCases identified by `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of test versions",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = EntityHistory.class)))
      })
  public EntityHistory listVersions(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().id(id).build();

    // Override OperationContext to change the entity to table and operation from VIEW_ALL to
    // VIEW_TESTS
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.VIEW_TESTS);
    return super.listVersionsInternal(securityContext, id, operationContext, resourceContext);
  }

  @GET
  @Path("/{id}")
  @Operation(
      summary = "Get a test case by Id",
      description = "Get a TestCase by `Id`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The TestCases",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class))),
        @ApiResponse(responseCode = "404", description = "Test for instance {id} is not found")
      })
  public TestCase get(
      @Context UriInfo uriInfo,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
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
    // Override OperationContext to change the entity to table and operation from VIEW_ALL to
    // VIEW_TESTS
    Fields fields = getFields(fieldsParam);
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.VIEW_TESTS);
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().id(id).build();
    return getInternal(
        uriInfo, securityContext, id, fields, include, operationContext, resourceContext);
  }

  @GET
  @Path("/name/{fqn}")
  @Operation(
      operationId = "getTestCaseByName",
      summary = "Get a test case by fully qualified name",
      description = "Get a test case by `fullyQualifiedName`.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The TestCase",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class))),
        @ApiResponse(responseCode = "404", description = "Test for instance {fqn} is not found")
      })
  public TestCase getByName(
      @Context UriInfo uriInfo,
      @Parameter(
              description = "Fully qualified name of the test case",
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
    // Override OperationContext to change the entity to table and operation from VIEW_ALL to
    // VIEW_TESTS
    Fields fields = getFields(fieldsParam);
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.VIEW_TESTS);
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().name(fqn).build();
    return getByNameInternal(
        uriInfo, securityContext, fqn, fields, include, operationContext, resourceContext);
  }

  @GET
  @Path("/{id}/versions/{version}")
  @Operation(
      operationId = "getSpecificTestCaseVersion",
      summary = "Get a version of the test case",
      description = "Get a version of the test case by given `Id`",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Test",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class))),
        @ApiResponse(
            responseCode = "404",
            description = "Test for instance {id} and version {version} is not found")
      })
  public TestCase getVersion(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Parameter(
              description = "Test version number in the form `major`.`minor`",
              schema = @Schema(type = "string", example = "0.1 or 1.1"))
          @PathParam("version")
          String version) {
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.VIEW_TESTS);
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().id(id).build();
    return super.getVersionInternal(
        securityContext, id, version, operationContext, resourceContext);
  }

  @POST
  @Operation(
      operationId = "createTestCase",
      summary = "Create a test case",
      description = "Create a test case",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The test",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class))),
        @ApiResponse(responseCode = "400", description = "Bad request")
      })
  public Response create(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateTestCase create) {
    // Override OperationContext to change the entity to table and operation from CREATE to
    // EDIT_TESTS
    EntityLink entityLink = EntityLink.parse(create.getEntityLink());
    TestCase test = getTestCase(create, securityContext.getUserPrincipal().getName(), entityLink);
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    ResourceContextInterface resourceContext =
        TestCaseResourceContext.builder().entityLink(entityLink).build();
    limits.enforceLimits(
        securityContext,
        new CreateResourceContext<>(entityType, test),
        new OperationContext(Entity.TEST_CASE, MetadataOperation.EDIT_TESTS));
    authorizer.authorize(securityContext, operationContext, resourceContext);
    repository.isTestSuiteExecutable(create.getTestSuite());
    test = addHref(uriInfo, repository.create(uriInfo, test));
    return Response.created(test.getHref()).entity(test).build();
  }

  @PATCH
  @Path("/{id}")
  @Operation(
      operationId = "patchTest",
      summary = "Update a test case",
      description = "Update an existing test using JsonPatch.",
      externalDocs =
          @ExternalDocumentation(
              description = "JsonPatch RFC",
              url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patch(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
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
    // Override OperationContext to change the entity to table and operation from UPDATE to
    // EDIT_TESTS
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().id(id).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    PatchResponse<TestCase> response =
        repository.patch(uriInfo, id, securityContext.getUserPrincipal().getName(), patch);
    if (response.entity().getTestCaseResult() != null
        && response.entity().getTestCaseResult().getTestCaseStatus() == TestCaseStatus.Success) {
      repository.deleteTestCaseFailedRowsSample(id);
    }
    addHref(uriInfo, response.entity());
    return response.toResponse();
  }

  @PATCH
  @Path("/{fqn}/testCaseResult/{timestamp}")
  @Operation(
      operationId = "patchTestCaseResult",
      summary = "Update a test case result",
      description = "Update an existing test case using JsonPatch.",
      externalDocs =
          @ExternalDocumentation(
              description = "JsonPatch RFC",
              url = "https://tools.ietf.org/html/rfc6902"))
  @Consumes(MediaType.APPLICATION_JSON_PATCH_JSON)
  public Response patchTestCaseResult(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "fqn of the test case", schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn,
      @Parameter(description = "Timestamp of the testCase result", schema = @Schema(type = "long"))
          @PathParam("timestamp")
          Long timestamp,
      @RequestBody(
              description = "JsonPatch with array of operations",
              content =
                  @Content(
                      mediaType = MediaType.APPLICATION_JSON_PATCH_JSON,
                      examples = {
                        @ExampleObject("[{op:remove, path:/a},{op:add, path: /b, value: val}]")
                      }))
          JsonPatch patch) {
    // Override OperationContext to change the entity to table and operation from UPDATE to
    // EDIT_TESTS
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().name(fqn).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    PatchResponse<TestCaseResult> patchResponse =
        repository.patchTestCaseResults(fqn, timestamp, patch);
    return patchResponse.toResponse();
  }

  @PUT
  @Operation(
      operationId = "createOrUpdateTest",
      summary = "Update test case",
      description = "Create a TestCase, it it does not exist or update an existing TestCase.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "The updated testCase.",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class)))
      })
  public Response createOrUpdate(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateTestCase create) {
    // Override OperationContext to change the entity to table and operation from CREATE/UPDATE to
    // EDIT_TESTS
    EntityLink entityLink = EntityLink.parse(create.getEntityLink());
    ResourceContextInterface resourceContext =
        TestCaseResourceContext.builder().entityLink(entityLink).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    TestCase test = getTestCase(create, securityContext.getUserPrincipal().getName(), entityLink);
    repository.isTestSuiteExecutable(create.getTestSuite());
    repository.prepareInternal(test, true);
    PutResponse<TestCase> response = repository.createOrUpdate(uriInfo, test);
    addHref(uriInfo, response.getEntity());
    return response.toResponse();
  }

  @DELETE
  @Path("/{id}")
  @Operation(
      operationId = "deleteTestCase",
      summary = "Delete a test case by Id",
      description = "Delete a test case by `Id`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "Test case for instance {id} is not found")
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
          @DefaultValue("false")
          @QueryParam("recursive")
          boolean recursive,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id) {
    // Override OperationContext to change the entity to table and operation from DELETE to
    // EDIT_TESTS
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().id(id).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    return delete(uriInfo, securityContext, id, recursive, hardDelete);
  }

  @DELETE
  @Path("/name/{fqn}")
  @Operation(
      operationId = "deleteTestCaseByName",
      summary = "Delete a test case by fully qualified name",
      description = "Delete a testCase by `fullyQualifiedName`.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(responseCode = "404", description = "TestCase for instance {fqn} is not found")
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
          @DefaultValue("false")
          @QueryParam("recursive")
          boolean recursive,
      @Parameter(
              description = "Fully qualified name of the test case",
              schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn) {
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().name(fqn).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    return deleteByName(uriInfo, securityContext, fqn, recursive, hardDelete);
  }

  @DELETE
  @Path("/logicalTestCases/{testSuiteId}/{id}")
  @Operation(
      operationId = "deleteLogicalTestCase",
      summary = "Delete a logical test case by Id from a test suite",
      description = "Delete a logical test case by `Id` a test suite.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(
            responseCode = "404",
            description = "Logical test case for instance {id} is not found")
      })
  public Response deleteLogicalTestCase(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @PathParam("testSuiteId") UUID testSuiteId,
      @PathParam("id") UUID id) {
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().id(id).build();
    OperationContext operationContext =
        new OperationContext(Entity.TEST_SUITE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    DeleteResponse<TestCase> response =
        repository.deleteTestCaseFromLogicalTestSuite(testSuiteId, id);
    return response.toResponse();
  }

  @PUT
  @Path("/restore")
  @Operation(
      operationId = "restore",
      summary = "Restore a soft deleted test case",
      description = "Restore a soft deleted test case.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully restored the Chart ",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class)))
      })
  public Response restoreTestCase(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid RestoreEntity restore) {
    return restoreEntity(uriInfo, securityContext, restore.getId());
  }

  @PUT
  @Path("/{fqn}/testCaseResult")
  @Operation(
      operationId = "addTestCaseResult",
      summary = "Add test case result data",
      description = "Add test case result data to the testCase.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully updated the TestCase. ",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class)))
      })
  public Response addTestCaseResult(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fully qualified name of the test case",
              schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn,
      @Valid TestCaseResult testCaseResult) {
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().name(fqn).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    if (testCaseResult.getTestCaseStatus() == TestCaseStatus.Success) {
      TestCase testCase = repository.findByName(fqn, Include.ALL);
      repository.deleteTestCaseFailedRowsSample(testCase.getId());
    }
    return repository
        .addTestCaseResult(
            securityContext.getUserPrincipal().getName(), uriInfo, fqn, testCaseResult)
        .toResponse();
  }

  @GET
  @Path("/{fqn}/testCaseResult")
  @Operation(
      operationId = "listTestCaseResults",
      summary = "List of test case results",
      description =
          "Get a list of all the test case results for the given testCase id, optionally filtered by  `startTs` and `endTs` of the profile. "
              + "Use cursor-based pagination to limit the number of "
              + "entries in the list using `limit` and `before` or `after` query params.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "List of testCase results",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCaseResource.TestCaseResultList.class)))
      })
  public ResultList<TestCaseResult> listTestCaseResults(
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fully qualified name of the test case",
              schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn,
      @Parameter(
              description = "Filter testCase results after the given start timestamp",
              schema = @Schema(type = "number"))
          @NonNull
          @QueryParam("startTs")
          Long startTs,
      @Parameter(
              description = "Filter testCase results before the given end timestamp",
              schema = @Schema(type = "number"))
          @NonNull
          @QueryParam("endTs")
          Long endTs) {
    return repository.getTestCaseResults(fqn, startTs, endTs);
  }

  @DELETE
  @Path("/{fqn}/testCaseResult/{timestamp}")
  @Operation(
      operationId = "DeleteTestCaseResult",
      summary = "Delete test case result",
      description = "Delete testCase result for a testCase.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully deleted the TestCaseResult",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class)))
      })
  public Response deleteTestCaseResult(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(
              description = "Fully qualified name of the test case",
              schema = @Schema(type = "string"))
          @PathParam("fqn")
          String fqn,
      @Parameter(description = "Timestamp of the testCase result", schema = @Schema(type = "long"))
          @PathParam("timestamp")
          Long timestamp) {
    ResourceContextInterface resourceContext = TestCaseResourceContext.builder().name(fqn).build();
    OperationContext operationContext =
        new OperationContext(Entity.TABLE, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    return repository
        .deleteTestCaseResult(securityContext.getUserPrincipal().getName(), fqn, timestamp)
        .toResponse();
  }

  @PUT
  @Path("/{id}/failedRowsSample")
  @Operation(
      operationId = "addFailedRowsSample",
      summary = "Add failed rows sample data",
      description = "Add a sample of failed rows for this test case.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully update the test case with failed rows sample data.",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class))),
        @ApiResponse(
            responseCode = "400",
            description = "Failed rows can only be added to a failed test case.")
      })
  public TestCase addFailedRowsData(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Valid TableData tableData,
      @DefaultValue("true") @QueryParam("validate") boolean validate) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    TestCase testCase = repository.find(id, Include.NON_DELETED);
    if (testCase.getTestCaseResult() == null
        || !testCase.getTestCaseResult().getTestCaseStatus().equals(TestCaseStatus.Failed)) {
      throw new IllegalArgumentException("Failed rows can only be added to a failed test case.");
    }
    return addHref(uriInfo, repository.addFailedRowsSample(testCase, tableData, validate));
  }

  @PUT
  @Path("/{id}/inspectionQuery")
  @Operation(
      operationId = "addInspectionQuery",
      summary = "Add inspection query data",
      description = "Add an inspection query for this test case.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully update the test case with an inspection query.",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestCase.class)))
      })
  public TestCase addInspectionQuery(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the test case", schema = @Schema(type = "UUID"))
          @PathParam("id")
          UUID id,
      @Valid String query) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.EDIT_TESTS);
    authorizer.authorize(securityContext, operationContext, getResourceContextById(id));
    return addHref(uriInfo, repository.addInspectionQuery(uriInfo, id, query));
  }

  @GET
  @Path("/{id}/failedRowsSample")
  @Operation(
      operationId = "getFailedRowsSample",
      summary = "Get failed rows sample data",
      description = "Get a sample of failed rows for this test case.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully retrieved the test case with failed rows sample data.",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TableData.class)))
      })
  public TableData getFailedRowsData(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the table", schema = @Schema(type = "UUID")) @PathParam("id")
          UUID id) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.VIEW_TEST_CASE_FAILED_ROWS_SAMPLE);
    ResourceContext<?> resourceContext = getResourceContextById(id);
    TestCase testCase = repository.find(id, Include.NON_DELETED);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    boolean authorizePII = authorizer.authorizePII(securityContext, resourceContext.getOwners());
    return repository.getSampleData(testCase, authorizePII);
  }

  @DELETE
  @Path("/{id}/failedRowsSample")
  @Operation(
      operationId = "deleteFailedRowsSample",
      summary = "Delete failed rows sample data",
      description = "Delete a sample of failed rows for this test case.",
      responses = {
        @ApiResponse(responseCode = "200", description = "OK"),
        @ApiResponse(
            responseCode = "404",
            description = "Failed rows sample data for test case {id} is not found.")
      })
  public Response deleteFailedRowsData(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Parameter(description = "Id of the table", schema = @Schema(type = "UUID")) @PathParam("id")
          UUID id) {
    OperationContext operationContext =
        new OperationContext(entityType, MetadataOperation.DELETE_TEST_CASE_FAILED_ROWS_SAMPLE);
    ResourceContext<?> resourceContext = getResourceContextById(id);
    authorizer.authorize(securityContext, operationContext, resourceContext);
    RestUtil.DeleteResponse<TableData> response = repository.deleteTestCaseFailedRowsSample(id);
    return response.toResponse();
  }

  @PUT
  @Path("/logicalTestCases")
  @Operation(
      operationId = "addTestCasesToLogicalTestSuite",
      summary = "Add test cases to a logical test suite",
      description = "Add test cases to a logical test suite.",
      responses = {
        @ApiResponse(
            responseCode = "200",
            description = "Successfully added test cases to the logical test suite.",
            content =
                @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TestSuite.class)))
      })
  public Response addTestCasesToLogicalTestSuite(
      @Context UriInfo uriInfo,
      @Context SecurityContext securityContext,
      @Valid CreateLogicalTestCases createLogicalTestCases) {

    // don't get entity from cache as test result summary may be stale
    TestSuite testSuite =
        Entity.getEntity(
            Entity.TEST_SUITE, createLogicalTestCases.getTestSuiteId(), null, null, false);
    OperationContext operationContext =
        new OperationContext(Entity.TEST_SUITE, MetadataOperation.EDIT_TESTS);
    ResourceContextInterface resourceContext =
        TestCaseResourceContext.builder().entity(testSuite).build();
    authorizer.authorize(securityContext, operationContext, resourceContext);
    if (Boolean.TRUE.equals(testSuite.getExecutable())) {
      throw new IllegalArgumentException(
          "You are trying to add test cases to an executable test suite.");
    }
    List<UUID> testCaseIds = createLogicalTestCases.getTestCaseIds();

    if (testCaseIds == null || testCaseIds.isEmpty()) {
      return new RestUtil.PutResponse<>(Response.Status.OK, testSuite, ENTITY_NO_CHANGE)
          .toResponse();
    }

    int existingTestCaseCount = repository.getTestCaseCount(testCaseIds);
    if (existingTestCaseCount != testCaseIds.size()) {
      throw new IllegalArgumentException(
          "You are trying to add one or more test cases that do not exist.");
    }
    return repository.addTestCasesToLogicalTestSuite(testSuite, testCaseIds).toResponse();
  }

  private ResourceContextInterface getResourceContext(String entityLink, Filter filter) {
    ResourceContextInterface resourceContext;
    if (entityLink != null) {
      EntityLink entityLinkParsed = EntityLink.parse(entityLink);
      filter.addQueryParam("entityFQN", entityLinkParsed.getFullyQualifiedFieldValue());
      resourceContext = TestCaseResourceContext.builder().entityLink(entityLinkParsed).build();
    } else {
      resourceContext = TestCaseResourceContext.builder().build();
    }
    return resourceContext;
  }

  private TestCase getTestCase(CreateTestCase create, String user, EntityLink entityLink) {
    return repository
        .copy(new TestCase(), create, user)
        .withDescription(create.getDescription())
        .withName(create.getName())
        .withDisplayName(create.getDisplayName())
        .withParameterValues(create.getParameterValues())
        .withEntityLink(create.getEntityLink())
        .withComputePassedFailedRowCount(create.getComputePassedFailedRowCount())
        .withUseDynamicAssertion(create.getUseDynamicAssertion())
        .withEntityFQN(entityLink.getFullyQualifiedFieldValue())
        .withTestSuite(getEntityReference(Entity.TEST_SUITE, create.getTestSuite()))
        .withTestDefinition(getEntityReference(Entity.TEST_DEFINITION, create.getTestDefinition()));
  }
}
