#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
Generic Workflow entrypoint to execute Applications
"""
import json
from typing import cast

from airflow import DAG
from metadata.generated.schema.entity.services.ingestionPipelines.ingestionPipeline import IngestionPipeline
from metadata.generated.schema.metadataIngestion.application import OpenMetadataApplicationConfig
from metadata.generated.schema.metadataIngestion.applicationPipeline import ApplicationPipeline
from metadata.ingestion.models.encoders import show_secrets_encoder
from metadata.utils.workflow_output_handler import print_status
from metadata.workflow.application import ApplicationWorkflow

from openmetadata_managed_apis.utils.logger import set_operator_logger
from openmetadata_managed_apis.workflows.ingestion.common import build_workflow_config_property, build_dag


def application_workflow(application_workflow_config: OpenMetadataApplicationConfig):
    """
    Task that creates and runs the ingestion workflow.

    The workflow_config gets cooked form the incoming
    ingestionPipeline.

    This is the callable used to create the PythonOperator
    """

    set_operator_logger(application_workflow_config)

    config = json.loads(application_workflow_config.json(encoder=show_secrets_encoder))
    workflow = ApplicationWorkflow.create(config)

    workflow.execute()
    workflow.raise_from_status()
    print_status(workflow)
    workflow.stop()


def build_application_workflow_config(
    ingestion_pipeline: IngestionPipeline,
) -> OpenMetadataApplicationConfig:
    """
    Given an airflow_pipeline, prepare the workflow config JSON
    """

    # Here we have an application pipeline, so the Source Config is of type ApplicationPipeline
    application_pipeline_conf: ApplicationPipeline = cast(ingestion_pipeline.sourceConfig.config, ApplicationPipeline)

    application_workflow_config = OpenMetadataApplicationConfig(
        config=application_pipeline_conf.appConfig,
        workflowConfig=build_workflow_config_property(ingestion_pipeline),
        ingestionPipelineFQN=ingestion_pipeline.fullyQualifiedName.__root__,
    )

    return application_workflow_config


def build_application_dag(ingestion_pipeline: IngestionPipeline) -> DAG:
    """
    Build a simple metadata workflow DAG
    """
    application_workflow_config = build_application_workflow_config(ingestion_pipeline)
    dag = build_dag(
        task_name="application_task",
        ingestion_pipeline=ingestion_pipeline,
        workflow_config=application_workflow_config,
        workflow_fn=application_workflow,
    )

    return dag
