package org.openmetadata.catalog.resources.dqtests;

import static javax.ws.rs.core.Response.Status.BAD_REQUEST;
import static javax.ws.rs.core.Response.Status.NOT_FOUND;
import static javax.ws.rs.core.Response.Status.OK;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.openmetadata.catalog.util.TestUtils.ADMIN_AUTH_HEADERS;
import static org.openmetadata.catalog.util.TestUtils.assertResponse;
import static org.openmetadata.catalog.util.TestUtils.assertResponseContains;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.client.HttpResponseException;
import org.junit.jupiter.api.TestInfo;
import org.openmetadata.catalog.Entity;
import org.openmetadata.catalog.api.tests.CreateTest;
import org.openmetadata.catalog.resources.EntityResourceTest;
import org.openmetadata.catalog.test.TestCaseParameterValue;
import org.openmetadata.catalog.tests.Test;
import org.openmetadata.catalog.type.ChangeDescription;
import org.openmetadata.catalog.type.FieldChange;
import org.openmetadata.catalog.util.TestUtils;

@Slf4j
public class TestResourceTest extends EntityResourceTest<Test, CreateTest> {
  public TestResourceTest() {
    super(
        Entity.TEST,
        org.openmetadata.catalog.tests.Test.class,
        TestResource.TestList.class,
        "test",
        TestResource.FIELDS);
    supportsEmptyDescription = false;
    supportsFollowers = false;
    supportsAuthorizedMetadataOperations = false;
    supportsOwner = false;
  }

  @org.junit.jupiter.api.Test
  void post_testWithoutRequiredFields_4xx(TestInfo test) {
    // name is required field
    assertResponse(
        () -> createEntity(createRequest(test).withName(null), ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "[name must not be null]");
  }

  @org.junit.jupiter.api.Test
  void post_testWithInvalidEntityTestSuite_4xx(TestInfo test) {
    CreateTest create = createRequest(test);
    create.withEntity(TEST_DEFINITION1_REFERENCE).withTestSuite(TEST_TABLE1.getEntityReference());
    assertResponseContains(
        () -> createAndCheckEntity(create, ADMIN_AUTH_HEADERS),
        NOT_FOUND,
        "table instance for " + TEST_DEFINITION1_REFERENCE.getId() + " not found");

    CreateTest create1 = createRequest(test);
    create1.withEntity(TEST_TABLE1.getEntityReference()).withTestSuite(TEST_DEFINITION1_REFERENCE);
    assertResponseContains(
        () -> createAndCheckEntity(create1, ADMIN_AUTH_HEADERS),
        NOT_FOUND,
        "testSuite instance for " + TEST_DEFINITION1_REFERENCE.getId() + " not found");

    CreateTest create2 = createRequest(test);
    create2
        .withEntity(TEST_TABLE1.getEntityReference())
        .withTestSuite(TEST_SUITE1_REFERENCE)
        .withTestDefinition(TEST_SUITE1_REFERENCE);
    assertResponseContains(
        () -> createAndCheckEntity(create2, ADMIN_AUTH_HEADERS),
        NOT_FOUND,
        "testDefinition instance for " + TEST_SUITE1_REFERENCE.getId() + " not found");
  }

  @org.junit.jupiter.api.Test
  void post_testWithInvalidParamValues_4xx(TestInfo test) {
    CreateTest create = createRequest(test);
    create
        .withEntity(TEST_TABLE1.getEntityReference())
        .withTestSuite(TEST_SUITE1_REFERENCE)
        .withTestDefinition(TEST_DEFINITION2_REFERENCE)
        .withParameterValues(List.of(new TestCaseParameterValue().withName("col").withValue("x")));
    assertResponseContains(
        () -> createAndCheckEntity(create, ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "Parameter Values doesn't match Test Definition Parameters");

    CreateTest create1 = createRequest(test);
    create1
        .withEntity(TEST_TABLE1.getEntityReference())
        .withTestSuite(TEST_SUITE1_REFERENCE)
        .withTestDefinition(TEST_DEFINITION3_REFERENCE);
    assertResponseContains(
        () -> createAndCheckEntity(create1, ADMIN_AUTH_HEADERS),
        BAD_REQUEST,
        "Required parameter missingCountValue is not passed in parameterValues");
  }

  @org.junit.jupiter.api.Test
  void createUpdateDelete_tests_200(TestInfo test) throws IOException {
    CreateTest create = createRequest(test);
    create
        .withEntity(TEST_TABLE1.getEntityReference())
        .withTestSuite(TEST_SUITE1_REFERENCE)
        .withTestDefinition(TEST_DEFINITION3_REFERENCE)
        .withParameterValues(List.of(new TestCaseParameterValue().withValue("100").withName("missingCountValue")));
    Test testCase = createAndCheckEntity(create, ADMIN_AUTH_HEADERS);
    testCase = getEntity(testCase.getId(), "entity,testSuite,testDefinition,owner", ADMIN_AUTH_HEADERS);
    validateCreatedEntity(testCase, create, ADMIN_AUTH_HEADERS);
    create.withTestDefinition(TEST_DEFINITION2_REFERENCE).withParameterValues(new ArrayList<>());
    List<FieldChange> addedFields = new ArrayList<>();
    addedFields.add(new FieldChange().withName("testDefinition").withNewValue(TEST_DEFINITION2_REFERENCE));
    List<FieldChange> deletedFields = new ArrayList<>();
    deletedFields.add(new FieldChange().withName("testDefinition").withOldValue(TEST_DEFINITION3_REFERENCE));
    List<FieldChange> updatedFields = new ArrayList<>();
    updatedFields.add(
        new FieldChange()
            .withName("parameterValues")
            .withOldValue(testCase.getParameterValues())
            .withNewValue(new ArrayList<>()));
    ChangeDescription change =
        getChangeDescription(testCase.getVersion())
            .withFieldsAdded(addedFields)
            .withFieldsDeleted(deletedFields)
            .withFieldsUpdated(updatedFields);
    testCase = updateAndCheckEntity(create, OK, ADMIN_AUTH_HEADERS, TestUtils.UpdateType.MINOR_UPDATE, change);
    testCase = getEntity(testCase.getId(), "entity,testSuite,testDefinition,owner", ADMIN_AUTH_HEADERS);
    validateCreatedEntity(testCase, create, ADMIN_AUTH_HEADERS);
  }

  @Override
  public CreateTest createRequest(String name) {
    return new CreateTest()
        .withName(name)
        .withDescription(name)
        .withEntity(TEST_TABLE1.getEntityReference())
        .withTestSuite(TEST_SUITE1_REFERENCE)
        .withTestDefinition(TEST_DEFINITION1_REFERENCE);
  }

  @Override
  public void validateCreatedEntity(Test createdEntity, CreateTest request, Map<String, String> authHeaders)
      throws HttpResponseException {
    assertEquals(request.getName(), createdEntity.getName());
    assertEquals(request.getDescription(), createdEntity.getDescription());
    assertEquals(request.getEntity(), createdEntity.getEntity());
    assertEquals(request.getTestSuite(), createdEntity.getTestSuite());
    assertEquals(request.getOwner(), createdEntity.getOwner());
    assertEquals(request.getTestDefinition(), createdEntity.getTestDefinition());
  }

  @Override
  public void compareEntities(Test expected, Test updated, Map<String, String> authHeaders)
      throws HttpResponseException {
    assertEquals(expected.getName(), updated.getName());
    assertEquals(expected.getDescription(), updated.getDescription());
  }

  @Override
  public Test validateGetWithDifferentFields(Test entity, boolean byName) throws HttpResponseException {
    return null;
  }

  @Override
  public void assertFieldChange(String fieldName, Object expected, Object actual) throws IOException {
    if (expected == actual) {
      return;
    }
  }
}
