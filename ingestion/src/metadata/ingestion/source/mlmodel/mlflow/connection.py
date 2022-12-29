#  Copyright 2021 Collate #pylint: disable=too-many-lines
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
from mlflow.tracking import MlflowClient

from metadata.generated.schema.entity.services.connections.mlmodel.mlflowConnection import (
    MlflowConnection,
)
from metadata.ingestion.connections.test_connections import SourceConnectionException


def get_connection(connection: MlflowConnection) -> MlflowClient:
    """
    Create connection
    """
    return MlflowClient(
        tracking_uri=connection.trackingUri,
        registry_uri=connection.registryUri,
    )


def test_connection(client: MlflowClient) -> None:
    """
    Test connection
    """
    try:
        client.list_registered_models()
    except Exception as exc:
        msg = f"Unknown error connecting with {client}: {exc}."
        raise SourceConnectionException(msg) from exc
