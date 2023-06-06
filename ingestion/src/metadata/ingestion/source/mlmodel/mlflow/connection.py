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
from typing import Optional

from metadata.generated.schema.entity.automations.workflow import (
    Workflow as AutomationWorkflow,
)
from metadata.generated.schema.entity.services.connections.mlmodel.mlflowConnection import (
    MlflowConnection,
)
from mlflow.tracking import MlflowClient

from metadata.ingestion.connections.test_connections import test_connection_steps
from metadata.ingestion.ometa.ometa_api import OpenMetadata


def get_connection(connection: MlflowConnection) -> MlflowClient:
    """
    Create connection
    """
    return MlflowClient(
        tracking_uri=connection.trackingUri,
        registry_uri=connection.registryUri,
    )


def test_connection(
    metadata: OpenMetadata,
    client: MlflowClient,
    service_connection: MlflowConnection,
    automation_workflow: Optional[AutomationWorkflow] = None,
) -> None:
    """
    Test connection. This can be executed either as part
    of a metadata workflow or during an Automation Workflow
    """

    test_fn = {"GetModels": client.list_registered_models}

    test_connection_steps(
        metadata=metadata,
        test_fn=test_fn,
        service_fqn=service_connection.type.value,
        automation_workflow=automation_workflow,
    )
