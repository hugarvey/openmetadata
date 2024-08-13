import sys
from dataclasses import dataclass
from typing import List

import pytest

from _openmetadata_testutils.pydantic.test_utils import assert_equal_pydantic_objects
from metadata.data_quality.api.models import TestCaseDefinition
from metadata.generated.schema.entity.services.databaseService import DatabaseService
from metadata.generated.schema.metadataIngestion.testSuitePipeline import (
    TestSuiteConfigType,
    TestSuitePipeline,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    OpenMetadataWorkflowConfig,
    Processor,
    Sink,
    Source,
    SourceConfig,
    WorkflowConfig,
)
from metadata.generated.schema.tests.basic import TestCaseStatus
from metadata.generated.schema.tests.testCase import TestCase
from metadata.generated.schema.tests.testSuite import TestSuite
from metadata.generated.schema.type.basic import ComponentConfig
from metadata.ingestion.api.status import TruncatedStackTraceError
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.workflow.data_quality import TestSuiteWorkflow
from metadata.workflow.metadata import MetadataWorkflow

if not sys.version_info >= (3, 9):
    pytest.skip("requires python 3.9+", allow_module_level=True)


@pytest.fixture()
def run_data_quality_workflow(
    run_workflow,
    ingestion_config,
    db_service: DatabaseService,
    metadata: OpenMetadata,
    sink_config,
    workflow_config,
):
    run_workflow(MetadataWorkflow, ingestion_config)
    test_suite_config = OpenMetadataWorkflowConfig(
        source=Source(
            type=TestSuiteConfigType.TestSuite.value,
            serviceName="MyTestSuite",
            sourceConfig=SourceConfig(
                config=TestSuitePipeline(
                    type=TestSuiteConfigType.TestSuite,
                    entityFullyQualifiedName=f"{db_service.fullyQualifiedName.root}.dvdrental.public.customer",
                )
            ),
            serviceConnection=db_service.connection,
        ),
        processor=Processor(
            type="orm-test-runner",
            config=ComponentConfig(
                {
                    "testCases": [
                        {
                            "name": "first_name_includes_tom_and_jerry_wo_enum",
                            "testDefinitionName": "columnValuesToBeInSet",
                            "columnName": "first_name",
                            "parameterValues": [
                                {"name": "allowedValues", "value": "['Tom', 'Jerry']"}
                            ],
                        },
                        {
                            "name": "first_name_includes_tom_and_jerry",
                            "testDefinitionName": "columnValuesToBeInSet",
                            "columnName": "first_name",
                            "parameterValues": [
                                {"name": "allowedValues", "value": "['Tom', 'Jerry']"},
                                {"name": "matchEnum", "value": ""},
                            ],
                        },
                        {
                            "name": "first_name_is_tom_or_jerry",
                            "testDefinitionName": "columnValuesToBeInSet",
                            "columnName": "first_name",
                            "parameterValues": [
                                {"name": "allowedValues", "value": "['Tom', 'Jerry']"},
                                {"name": "matchEnum", "value": "True"},
                            ],
                        },
                    ],
                }
            ),
        ),
        sink=Sink.model_validate(sink_config),
        workflowConfig=WorkflowConfig.model_validate(workflow_config),
    )
    test_suite_processor = TestSuiteWorkflow.create(test_suite_config)
    test_suite_processor.execute()
    test_suite_processor.raise_from_status()
    yield
    test_suite: TestSuite = metadata.get_by_name(
        TestSuite, "MyTestSuite", nullable=True
    )
    if test_suite:
        metadata.delete(TestSuite, test_suite.id, recursive=True, hard_delete=True)


@pytest.mark.parametrize(
    "test_case_name,expected_status",
    [
        ("first_name_includes_tom_and_jerry_wo_enum", TestCaseStatus.Success),
        ("first_name_includes_tom_and_jerry", TestCaseStatus.Success),
        ("first_name_is_tom_or_jerry", TestCaseStatus.Failed),
    ],
)
def test_data_quality(
    run_data_quality_workflow, metadata: OpenMetadata, test_case_name, expected_status
):
    test_cases: List[TestCase] = metadata.list_entities(
        TestCase, fields=["*"], skip_on_failure=True
    ).entities
    test_case: TestCase = next(
        (t for t in test_cases if t.name.root == test_case_name), None
    )
    assert test_case is not None
    assert test_case.testCaseResult.testCaseStatus == expected_status


@pytest.fixture()
def get_incompatible_column_type_config(workflow_config, sink_config):
    def inner(entity_fqn: str, incompatible_test_case: TestCaseDefinition):
        return {
            "source": {
                "type": "TestSuite",
                "serviceName": "MyTestSuite",
                "sourceConfig": {
                    "config": {
                        "type": "TestSuite",
                        "entityFullyQualifiedName": entity_fqn,
                    }
                },
            },
            "processor": {
                "type": "orm-test-runner",
                "config": {
                    "testCases": [
                        incompatible_test_case.model_dump(),
                        {
                            "name": "compatible_test",
                            "testDefinitionName": "columnValueMaxToBeBetween",
                            "columnName": "customer_id",
                            "parameterValues": [
                                {"name": "minValueForMaxInCol", "value": "0"},
                                {"name": "maxValueForMaxInCol", "value": "10"},
                            ],
                        },
                    ]
                },
            },
            "sink": sink_config,
            "workflowConfig": workflow_config,
        }

    return inner


@dataclass
class IncompatibleTypeParameter:
    entity_fqn: str
    test_case: TestCaseDefinition
    expected_failure: TruncatedStackTraceError


@pytest.fixture(
    params=[
        IncompatibleTypeParameter(
            entity_fqn="{database_service}.dvdrental.public.customer",
            test_case=TestCaseDefinition(
                name="string_max_between",
                testDefinitionName="columnValueMaxToBeBetween",
                columnName="first_name",
                parameterValues=[
                    {"name": "minValueForMaxInCol", "value": "0"},
                    {"name": "maxValueForMaxInCol", "value": "10"},
                ],
            ),
            expected_failure=TruncatedStackTraceError(
                name="Incompatible Column for Test Case",
                error="Test case string_max_between of type columnValueMaxToBeBetween "
                "is not compatible with column first_name of type VARCHAR",
            ),
        ),
        IncompatibleTypeParameter(
            entity_fqn="{database_service}.dvdrental.public.customer",
            test_case=TestCaseDefinition(
                name="unique_json_column",
                testDefinitionName="columnValuesToBeUnique",
                columnName="json_field",
            ),
            expected_failure=TruncatedStackTraceError(
                name="Incompatible Column for Test Case",
                error="Test case unique_json_column of type columnValuesToBeUnique "
                "is not compatible with column json_field of type JSON",
            ),
        ),
    ],
    ids=lambda x: x.test_case.name,
)
def parameters(request, db_service):
    request.param.entity_fqn = request.param.entity_fqn.format(
        database_service=db_service.fullyQualifiedName.root
    )
    return request.param


def test_incompatible_column_type(
    parameters: IncompatibleTypeParameter,
    patch_passwords_for_db_services,
    run_workflow,
    ingestion_config,
    get_incompatible_column_type_config,
    metadata: OpenMetadata,
    db_service,
    cleanup_fqns,
):
    run_workflow(MetadataWorkflow, ingestion_config)
    test_suite_processor = run_workflow(
        TestSuiteWorkflow,
        get_incompatible_column_type_config(
            parameters.entity_fqn, parameters.test_case
        ),
        raise_from_status=False,
    )
    cleanup_fqns(
        TestCase,
        f"{parameters.entity_fqn}.{parameters.test_case.columnName}.{parameters.test_case.name}",
    )
    assert_equal_pydantic_objects(
        parameters.expected_failure,
        test_suite_processor.steps[0].get_status().failures[0],
    )
    assert (
        f"{db_service.fullyQualifiedName.root}.dvdrental.public.customer.customer_id.compatible_test"
        in test_suite_processor.steps[1].get_status().records
    ), "Test case compatible_test should pass"
