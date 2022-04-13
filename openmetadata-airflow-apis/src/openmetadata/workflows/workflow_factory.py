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
Module used to create a DAG
based on incoming configs.

Called in dag_runner.j2
"""
import logging
import pathlib
from typing import Any, Dict

from airflow.models import DAG

# these are params that cannot be a dag name
from openmetadata.workflows.config import load_config_file
from openmetadata.workflows.workflow_builder import WorkflowBuilder

from metadata.generated.schema.entity.services.ingestionPipelines.ingestionPipeline import (
    IngestionPipeline,
)

logger = logging.getLogger(__name__)


class WorkflowFactory:
    """
    :param config: workflow config dictionary.
    :type config: dict
    """

    def __init__(self, airflow_pipeline: IngestionPipeline) -> None:
        self.dag = None
        self.airflow_pipeline = airflow_pipeline

    @classmethod
    def create(cls, config: str):
        config_file = pathlib.Path(config)
        workflow_config_dict = load_config_file(config_file)
        airflow_pipeline = IngestionPipeline(**workflow_config_dict)
        return cls(airflow_pipeline)

    def build_dag(self) -> DAG:
        """Build Workflow using the configuration"""

        workflow_builder: WorkflowBuilder = WorkflowBuilder(self.airflow_pipeline)
        try:
            workflow = workflow_builder.build()
        except Exception as err:
            raise Exception(
                f"Failed to generate workflow {self.airflow_pipeline.name.__root__}. verify config is correct"
            ) from err
        return workflow

    @staticmethod
    def register_dag(dag: DAG, globals_namespace: Dict[str, Any]) -> None:
        globals_namespace[dag.dag_id]: DAG = dag

    def generate_dag(self, globals_namespace: Dict[str, Any]) -> None:
        dag = self.build_dag()
        self.dag = dag
        self.register_dag(dag, globals_namespace)
        logger.info("registered the dag")

    def get_dag(self) -> DAG:
        return self.dag
