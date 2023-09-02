package org.openmetadata.service.resources.services;

import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static javax.ws.rs.core.Response.Status.OK;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.openmetadata.service.util.EntityUtil.fieldAdded;
import static org.openmetadata.service.util.EntityUtil.fieldUpdated;
import static org.openmetadata.service.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.service.util.TestUtils.assertResponse;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;
import java.util.UUID;
import javax.ws.rs.client.WebTarget;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.openmetadata.schema.api.services.CreateSearchService;
import org.openmetadata.schema.entity.services.SearchService;
import org.openmetadata.schema.entity.services.connections.TestConnectionResult;
import org.openmetadata.schema.entity.services.connections.TestConnectionResultStatus;
import org.openmetadata.schema.services.connections.search.ElasticSearchConnection;
import org.openmetadata.schema.type.ChangeDescription;
import org.openmetadata.schema.type.SearchConnection;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.EntityResourceTest;
import org.openmetadata.service.resources.services.searchIndexes.SearchServiceResource;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.TestUtils;

public class SearchServiceResourceTest extends EntityResourceTest<SearchService, CreateSearchService> {
  public SearchServiceResourceTest() {
    super(
        Entity.SEARCH_SERVICE,
        SearchService.class,
        SearchServiceResource.SearchServiceList.class,
        "services/searchServices",
        "owner");
    this.supportsPatch = false;
  }

  public void setupSearchService(TestInfo test) throws HttpResponseException {
    SearchServiceResourceTest esSearchServiceResourceTest = new SearchServiceResourceTest();
    CreateSearchService createSearchService =
        esSearchServiceResourceTest
            .createRequest(test, 1)
            .withName("elasticSearch")
            .withServiceType(CreateSearchService.SearchServiceType.ElasticSearch)
            .withConnection(TestUtils.ELASTIC_SEARCH_CONNECTION);

    SearchService esSearchService =
        new SearchServiceResourceTest().createEntity(createSearchService, ADMIN_AUTH_HEADERS);
    ELASTICSEARCH_SEARCH_SERVICE_REFERENCE = esSearchService.getEntityReference();
    SearchServiceResourceTest osSearchServiceResourceTest = new SearchServiceResourceTest();
    createSearchService =
        osSearchServiceResourceTest
            .createRequest(test, 1)
            .withName("opensearch")
            .withServiceType(CreateSearchService.SearchServiceType.OpenSearch)
            .withConnection(TestUtils.OPEN_SEARCH_CONNECTION);
    SearchService osSearchService =
        new SearchServiceResourceTest().createEntity(createSearchService, ADMIN_AUTH_HEADERS);
    OPENSEARCH_SEARCH_SERVICE_REFERENCE = osSearchService.getEntityReference();
  }

  @Test
  void post_withoutRequiredFields_400_badRequest(TestInfo test) {
    // Create StorageService with mandatory serviceType field empty
    assertResponse(
        () -> createEntity(createRequest(test).withServiceType(null), ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "[serviceType must not be null]");

    // Create StorageService with mandatory connection field empty
    assertResponse(
        () -> createEntity(createRequest(test).withConnection(null), ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "[connection must not be null]");
  }

  @Test
  void post_validService_as_admin_200_ok(TestInfo test) throws IOException {
    // Create Storage service with different optional fields
    Map<String, String> authHeaders = ADMIN_AUTH_HEADERS;
    createAndCheckEntity(createRequest(test, 1).withDescription(null), authHeaders);
    createAndCheckEntity(createRequest(test, 2).withDescription("description"), authHeaders);
    createAndCheckEntity(createRequest(test, 3).withConnection(TestUtils.ELASTIC_SEARCH_CONNECTION), authHeaders);
  }

  @Test
  void put_updateService_as_admin_2xx(TestInfo test) throws IOException, URISyntaxException {
    SearchConnection connection1 =
        new SearchConnection().withConfig(new ElasticSearchConnection().withHostPort(new URI("http://localhost:9300")));
    SearchService service =
        createAndCheckEntity(createRequest(test).withDescription(null).withConnection(connection1), ADMIN_AUTH_HEADERS);

    ElasticSearchConnection credentials2 =
        new ElasticSearchConnection().withHostPort(new URI("https://localhost:9400"));
    SearchConnection connection2 = new SearchConnection().withConfig(credentials2);

    // Update SearchService description and connection

    CreateSearchService update = createRequest(test).withDescription("description1").withConnection(connection2);

    ChangeDescription change = getChangeDescription(service.getVersion());
    fieldAdded(change, "description", "description1");
    fieldUpdated(change, "connection", connection1, connection2);
    updateAndCheckEntity(update, OK, ADMIN_AUTH_HEADERS, TestUtils.UpdateType.MINOR_UPDATE, change);
  }

  @Test
  void put_testConnectionResult_200(TestInfo test) throws IOException {
    SearchService service = createAndCheckEntity(createRequest(test), ADMIN_AUTH_HEADERS);
    // By default, we have no result logged in
    assertNull(service.getTestConnectionResult());
    SearchService updatedService = putTestConnectionResult(service.getId(), TEST_CONNECTION_RESULT, ADMIN_AUTH_HEADERS);
    // Validate that the data got properly stored
    assertNotNull(updatedService.getTestConnectionResult());
    assertEquals(TestConnectionResultStatus.SUCCESSFUL, updatedService.getTestConnectionResult().getStatus());
    assertEquals(updatedService.getConnection(), service.getConnection());
    // Check that the stored data is also correct
    SearchService stored = getEntity(service.getId(), ADMIN_AUTH_HEADERS);
    assertNotNull(stored.getTestConnectionResult());
    assertEquals(TestConnectionResultStatus.SUCCESSFUL, stored.getTestConnectionResult().getStatus());
    assertEquals(stored.getConnection(), service.getConnection());
  }

  public SearchService putTestConnectionResult(
      UUID serviceId, TestConnectionResult testConnectionResult, Map<String, String> authHeaders)
      throws HttpResponseException {
    WebTarget target = getResource(serviceId).path("/testConnectionResult");
    return TestUtils.put(target, testConnectionResult, SearchService.class, OK, authHeaders);
  }

  @Override
  public CreateSearchService createRequest(String name) {
    try {
      return new CreateSearchService()
          .withName(name)
          .withServiceType(CreateSearchService.SearchServiceType.ElasticSearch)
          .withConnection(
              new SearchConnection()
                  .withConfig(new ElasticSearchConnection().withHostPort(new URI("http://localhost:9200"))));
    } catch (URISyntaxException e) {
      throw new RuntimeException(e);
    }
  }

  @Override
  public void validateCreatedEntity(
      SearchService service, CreateSearchService createRequest, Map<String, String> authHeaders)
      throws HttpResponseException {
    assertEquals(createRequest.getName(), service.getName());
    SearchConnection expectedConnection = createRequest.getConnection();
    SearchConnection actualConnection = service.getConnection();
    validateConnection(expectedConnection, actualConnection, service.getServiceType());
  }

  @Override
  public void compareEntities(SearchService expected, SearchService updated, Map<String, String> authHeaders)
      throws HttpResponseException {
    // PATCH operation is not supported by this entity

  }

  @Override
  public SearchService validateGetWithDifferentFields(SearchService service, boolean byName)
      throws HttpResponseException {
    String fields = "";
    service =
        byName
            ? getEntityByName(service.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(service.getId(), fields, ADMIN_AUTH_HEADERS);
    TestUtils.assertListNull(service.getOwner());

    fields = "owner,tags";
    service =
        byName
            ? getEntityByName(service.getFullyQualifiedName(), fields, ADMIN_AUTH_HEADERS)
            : getEntity(service.getId(), fields, ADMIN_AUTH_HEADERS);
    // Checks for other owner, tags, and followers is done in the base class
    return service;
  }

  @Override
  public void assertFieldChange(String fieldName, Object expected, Object actual) throws IOException {
    if (fieldName.equals("connection")) {
      assertTrue(((String) actual).contains("-encrypted-value"));
    } else {
      super.assertCommonFieldChange(fieldName, expected, actual);
    }
  }

  private void validateConnection(
      SearchConnection expectedConnection,
      SearchConnection actualConnection,
      CreateSearchService.SearchServiceType serviceType) {
    if (expectedConnection != null && actualConnection != null) {
      if (serviceType == CreateSearchService.SearchServiceType.ElasticSearch) {
        ElasticSearchConnection expectedESConnection = (ElasticSearchConnection) expectedConnection.getConfig();
        ElasticSearchConnection actualESConnection;
        if (actualConnection.getConfig() instanceof ElasticSearchConnection) {
          actualESConnection = (ElasticSearchConnection) actualConnection.getConfig();
        } else {
          actualESConnection = JsonUtils.convertValue(actualConnection.getConfig(), ElasticSearchConnection.class);
        }
        assertEquals(expectedESConnection.getHostPort(), actualESConnection.getHostPort());
      }
    }
  }
}
