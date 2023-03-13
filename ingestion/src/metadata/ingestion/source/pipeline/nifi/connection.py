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
from metadata.generated.schema.entity.services.connections.pipeline.nifiConnection import (
    BasicAuthentication,
    NifiConnection,
)
from metadata.ingestion.connections.test_connections import SourceConnectionException
from metadata.ingestion.source.pipeline.nifi.client import NifiClient


def get_connection(connection: NifiConnection) -> NifiClient:
    """
    Create connection
    """
    if isinstance(connection.nifiConfig, BasicAuthentication):
        return NifiClient(
            host_port=connection.hostPort,
            username=connection.nifiConfig.username,
            password=connection.nifiConfig.password.get_secret_value()
            if connection.nifiConfig.password
            else None,
            verify=connection.nifiConfig.verifySSL,
        )

    return NifiClient(
        host_port=connection.hostPort,
        ca_file_path=connection.nifiConfig.certificateAuthorityPath,
        client_cert_path=connection.nifiConfig.clientCertificatePath,
        client_key_path=connection.nifiConfig.clientkeyPath,
    )


def test_connection(client: NifiClient, _) -> None:
    """
    Test connection
    """
    try:
        # Check the property value
        client.resources
    except Exception as err:
        raise SourceConnectionException(
            f"Unknown error connecting with {client} - {err}."
        ) from err
