#  Copyright 2022 Collate
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
Test Datalake connector with CLI
"""
from pathlib import Path
from typing import List

from sqlalchemy.engine import Engine

from metadata.ingestion.api.sink import SinkStatus
from metadata.ingestion.api.source import SourceStatus
from metadata.ingestion.api.workflow import Workflow

from .test_cli_datalake_base import PATH_TO_RESOURCES, DatalakeBase
from .test_cli_db_base_common import CliCommonDB


class DatalakeCliTest(DatalakeBase.TestSuite):
    """
    Datalake CLI Tests
    """

    @classmethod
    def setUpClass(cls) -> None:
        connector = cls.get_connector_name()
        workflow: Workflow = cls.get_workflow(connector)
        cls.client = workflow.source.client
        cls.openmetadata = workflow.source.metadata
        cls.config_file_path = str(
            Path(PATH_TO_RESOURCES + f"/database/{connector}/{connector}.yaml")
        )
        cls.test_file_path = str(
            Path(PATH_TO_RESOURCES + f"/database/{connector}/test.yaml")
        )

    @staticmethod
    def get_connector_name() -> str:
        return "datalake"

    def assert_for_vanilla_ingestion(
        self, source_status: SourceStatus, sink_status: SinkStatus
    ) -> None:
        self.assertTrue(len(source_status.failures) == 0)
        self.assertTrue(len(source_status.warnings) == 0)
        self.assertTrue(len(source_status.filtered) == 0)
        self.assertTrue(len(source_status.success) >= self.expected_tables())
        self.assertTrue(len(sink_status.failures) == 0)
        self.assertTrue(len(sink_status.warnings) == 0)
        self.assertTrue(len(sink_status.records) > self.expected_tables())

    @staticmethod
    def expected_tables() -> int:
        return 22

    @staticmethod
    def expected_schema() -> str:
        return "local_datalake1.default.awsdatalake-testing"

    @staticmethod
    def get_includes_tables() -> List[str]:
        return ["data/customers.*"]

    @staticmethod
    def get_excludes_tables() -> List[str]:
        return ["data/sales.*"]
