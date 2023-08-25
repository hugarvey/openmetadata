package org.openmetadata.service.jdbi3;

import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;
import static org.openmetadata.service.Entity.TEST_CASE;
import static org.openmetadata.service.Entity.TEST_SUITE;
import static org.openmetadata.service.jdbi3.TestCaseRepository.TESTCASE_RESULT_EXTENSION;
import static org.openmetadata.service.util.FullyQualifiedName.quoteName;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.ws.rs.core.SecurityContext;
import lombok.extern.slf4j.Slf4j;
import org.openmetadata.schema.entity.data.Table;
import org.openmetadata.schema.tests.ResultSummary;
import org.openmetadata.schema.tests.TestSuite;
import org.openmetadata.schema.tests.type.TestCaseResult;
import org.openmetadata.schema.tests.type.TestCaseStatus;
import org.openmetadata.schema.tests.type.TestSummary;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.Include;
import org.openmetadata.schema.type.Relationship;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.dqtests.TestSuiteResource;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.FullyQualifiedName;
import org.openmetadata.service.util.JsonUtils;
import org.openmetadata.service.util.RestUtil;

@Slf4j
public class TestSuiteRepository extends EntityRepository<TestSuite> {
  private static final String UPDATE_FIELDS = "tests";
  private static final String PATCH_FIELDS = "tests";

  public TestSuiteRepository(CollectionDAO dao) {
    super(
        TestSuiteResource.COLLECTION_PATH,
        TEST_SUITE,
        TestSuite.class,
        dao.testSuiteDAO(),
        dao,
        PATCH_FIELDS,
        UPDATE_FIELDS);
    quoteFqn = false;
  }

  @Override
  public TestSuite setFields(TestSuite entity, EntityUtil.Fields fields) {
    entity.setPipelines(fields.contains("pipelines") ? getIngestionPipelines(entity) : entity.getPipelines());
    entity.setSummary(fields.contains("summary") ? getTestCasesExecutionSummary(entity) : entity.getSummary());
    return entity.withTests(fields.contains("tests") ? getTestCases(entity) : entity.getTests());
  }

  @Override
  public TestSuite clearFields(TestSuite entity, EntityUtil.Fields fields) {
    entity.setPipelines(fields.contains("pipelines") ? entity.getPipelines() : null);
    entity.setSummary(fields.contains("summary") ? entity.getSummary() : null);
    return entity.withTests(fields.contains("tests") ? entity.getTests() : null);
  }

  private TestSummary buildTestSummary(HashMap<String, Integer> testCaseSummary, int total) {

    return new TestSummary()
        .withAborted(testCaseSummary.getOrDefault(TestCaseStatus.Aborted.toString(), 0))
        .withFailed(testCaseSummary.getOrDefault(TestCaseStatus.Failed.toString(), 0))
        .withSuccess(testCaseSummary.getOrDefault(TestCaseStatus.Success.toString(), 0))
        .withTotal(total);
  }

  @Override
  public void setFullyQualifiedName(TestSuite testSuite) {
    if (testSuite.getExecutableEntityReference() != null) {
      testSuite.setFullyQualifiedName(
          FullyQualifiedName.add(testSuite.getExecutableEntityReference().getFullyQualifiedName(), "testSuite"));
    } else {
      testSuite.setFullyQualifiedName(quoteName(testSuite.getName()));
    }
  }

  private HashMap<String, Integer> getResultSummary(TestSuite testSuite) {
    HashMap<String, Integer> testCaseSummary = new HashMap<>();
    if (testSuite.getExecutable()) {
      // for executable test suite, we'll have the summary in the test suite itself
      for (ResultSummary resultSummary : testSuite.getTestCaseResultSummary()) {
        String status = resultSummary.getStatus().toString();
        testCaseSummary.put(status, testCaseSummary.getOrDefault(status, 0) + 1);
      }
    } else {
      // for logical test suite, we'll need to fetch the summary from the test cases
      // as test cases can be dynamically added or removed
      List<EntityReference> testCasesEntityRef = getTestCases(testSuite);
      List<String> testCaseFQNHashes =
          testCasesEntityRef.stream()
              .map(EntityReference::getFullyQualifiedName)
              .collect(Collectors.toList())
              .stream()
              .map(FullyQualifiedName::buildHash)
              .collect(Collectors.toList());

      List<String> jsonList =
          daoCollection
              .entityExtensionTimeSeriesDao()
              .getLatestExtensionByFQNs(testCaseFQNHashes, TESTCASE_RESULT_EXTENSION);
      for (String json : jsonList) {
        TestCaseResult testCaseResult;
        testCaseResult = JsonUtils.readValue(json, TestCaseResult.class);
        String status = testCaseResult.getTestCaseStatus().toString();
        testCaseSummary.put(status, testCaseSummary.getOrDefault(status, 0) + 1);
      }
    }

    return testCaseSummary;
  }

  private TestSummary getTestCasesExecutionSummary(TestSuite entity) {
    if ((entity.getTestCaseResultSummary().isEmpty()) && (entity.getExecutable())) return new TestSummary();
    HashMap<String, Integer> testSummary = getResultSummary(entity);
    int total = testSummary.values().stream().mapToInt(Integer::intValue).sum();
    return buildTestSummary(testSummary, total);
  }

  private TestSummary getTestCasesExecutionSummary(List<TestSuite> entities) {
    if (entities.isEmpty()) return new TestSummary();

    HashMap<String, Integer> testsSummary = new HashMap<>();
    int total = 0;
    for (TestSuite testSuite : entities) {
      HashMap<String, Integer> testSummary = getResultSummary(testSuite);
      for (Map.Entry<String, Integer> entry : testSummary.entrySet()) {
        testsSummary.put(entry.getKey(), testsSummary.getOrDefault(entry.getKey(), 0) + entry.getValue());
      }
      total += testSummary.values().stream().mapToInt(Integer::intValue).sum();
    }

    return buildTestSummary(testsSummary, total);
  }

  public TestSummary getTestSummary(UUID testSuiteId) {
    TestSummary testSummary;
    if (testSuiteId == null) {
      ListFilter filter = new ListFilter();
      // if we are fetching the summary for all test suites we will
      // only return the executable test suites to not count the same test case multiple times
      filter.addQueryParam("testSuiteType", "executable");
      List<TestSuite> testSuites = listAll(EntityUtil.Fields.EMPTY_FIELDS, filter);
      testSummary = getTestCasesExecutionSummary(testSuites);
    } else {
      TestSuite testSuite = find(testSuiteId, Include.ALL);
      testSummary = getTestCasesExecutionSummary(testSuite);
    }

    return testSummary;
  }

  @Override
  public void prepare(TestSuite entity) {
    /* Nothing to do */
  }

  private List<EntityReference> getTestCases(TestSuite entity) {
    return findTo(entity.getId(), TEST_SUITE, Relationship.CONTAINS, TEST_CASE);
  }

  @Override
  public EntityRepository<TestSuite>.EntityUpdater getUpdater(
      TestSuite original, TestSuite updated, Operation operation) {
    return new TestSuiteUpdater(original, updated, operation);
  }

  @Override
  public void storeEntity(TestSuite entity, boolean update) {
    store(entity, update);
  }

  @Override
  public void storeRelationships(TestSuite entity) {
    if (Boolean.TRUE.equals(entity.getExecutable())) {
      storeExecutableRelationship(entity);
    }
  }

  public void storeExecutableRelationship(TestSuite testSuite) {
    Table table =
        Entity.getEntityByName(
            Entity.TABLE, testSuite.getExecutableEntityReference().getFullyQualifiedName(), null, null);
    addRelationship(table.getId(), testSuite.getId(), Entity.TABLE, TEST_SUITE, Relationship.CONTAINS);
  }

  public RestUtil.DeleteResponse<TestSuite> deleteLogicalTestSuite(
      SecurityContext securityContext, TestSuite original, boolean hardDelete) {
    // deleting a logical will delete the test suite and only remove
    // the relationship to test cases if hardDelete is true. Test Cases
    // will not be deleted.
    String updatedBy = securityContext.getUserPrincipal().getName();
    preDelete(original);
    setFieldsInternal(original, putFields);

    String changeType;
    TestSuite updated = JsonUtils.readValue(JsonUtils.pojoToJson(original), TestSuite.class);
    setFieldsInternal(updated, putFields);

    if (supportsSoftDelete && !hardDelete) {
      updated.setUpdatedBy(updatedBy);
      updated.setUpdatedAt(System.currentTimeMillis());
      updated.setDeleted(true);
      EntityUpdater updater = getUpdater(original, updated, Operation.SOFT_DELETE);
      updater.update();
      changeType = RestUtil.ENTITY_SOFT_DELETED;
    } else {
      cleanup(updated);
      changeType = RestUtil.ENTITY_DELETED;
    }
    LOG.info("{} deleted {}", hardDelete ? "Hard" : "Soft", updated.getFullyQualifiedName());
    return new RestUtil.DeleteResponse<>(updated, changeType);
  }

  public class TestSuiteUpdater extends EntityUpdater {
    public TestSuiteUpdater(TestSuite original, TestSuite updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() {
      List<EntityReference> origTests = listOrEmpty(original.getTests());
      List<EntityReference> updatedTests = listOrEmpty(updated.getTests());
      recordChange("tests", origTests, updatedTests);
    }
  }
}
