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
from botocore.client import ClientError

from metadata.clients.aws_client import AWSClient
from metadata.generated.schema.entity.services.connections.pipeline.gluePipelineConnection import (
    GluePipelineConnection,
)
from metadata.ingestion.connections.test_connections import SourceConnectionException


def get_connection(connection: GluePipelineConnection):
    """
    Create connection
    """
    return AWSClient(connection.awsConfig).get_glue_client()


def test_connection(client) -> None:
    """
    Test connection
    """
    try:
        client.list_workflows()
    except ClientError as err:
        msg = f"Connection error for {client}: {err}. Check the connection details."
        raise SourceConnectionException(msg) from err
    except Exception as exc:
        msg = f"Unknown error connecting with {client}: {exc}."
        raise SourceConnectionException(msg) from exc
