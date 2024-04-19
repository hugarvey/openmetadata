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
Source connection handler
"""
from typing import Optional, Tuple

from metadata.generated.schema.entity.automations.workflow import (
    Workflow as AutomationWorkflow,
)
from metadata.generated.schema.entity.services.connections.dashboard.powerBIConnection import (
    PowerBIConnection,
)
from metadata.ingestion.connections.test_connections import test_connection_steps
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.dashboard.powerbi.client import PowerBiApiClient, PowerBiClient

from metadata.ingestion.source.dashboard.powerbi.file_client import PowerBiFileClient


def get_connection(connection: PowerBIConnection) -> PowerBiApiClient:
    """
    Create connection
    """
    client = PowerBiClient(
        api_client=PowerBiApiClient(connection)
    )
    if connection.pbitFilesSource:
        client.file_client = PowerBiFileClient(connection)
    return client


def test_connection(
    metadata: OpenMetadata,
    client: PowerBiClient,
    service_connection: PowerBIConnection,
    automation_workflow: Optional[AutomationWorkflow] = None,
) -> None:
    """
    Test connection. This can be executed either as part
    of a metadata workflow or during an Automation Workflow
    """
    test_fn = {"GetDashboards": client.api_client.fetch_dashboards}

    test_connection_steps(
        metadata=metadata,
        test_fn=test_fn,
        service_type=service_connection.type.value,
        automation_workflow=automation_workflow,
    )
