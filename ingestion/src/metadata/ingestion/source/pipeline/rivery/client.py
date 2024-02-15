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
Client to interact with rivery apis
"""
import json
from typing import List

from metadata.generated.schema.entity.services.connections.pipeline.riveryConnection import (
    RiveryConnection,
)
from metadata.ingestion.ometa.client import REST, APIError, ClientConfig
from metadata.utils.constants import AUTHORIZATION_HEADER, NO_ACCESS_TOKEN
from metadata.utils.credentials import generate_http_basic_token


class RiveryClient:
    """
    Client handling API communication with Rivery
    """

    def __init__(self, config: RiveryConnection):
        self.config = config
        client_config: ClientConfig = ClientConfig(
            base_url=self.config.hostPort,
            api_version="api/v1",
            auth_header=AUTHORIZATION_HEADER,
            auth_token=lambda: (NO_ACCESS_TOKEN, 0),
        )
        if self.config.username:
            client_config.auth_token_mode = "Basic"
            client_config.auth_token = lambda: (
                generate_http_basic_token(
                    self.config.username, self.config.password.get_secret_value()
                ),
                0,
            )

        self.client = REST(client_config)

    def list_workspaces(self) -> List[dict]:
        """
        Method returns the list of workflows
        an rivery instance can contain multiple workflows
        """
        response = self.client.post("/workspaces/list")
        if response.get("exceptionStack"):
            raise APIError(response["message"])
        return response.get("workspaces")

    def list_connections(self, workflow_id: str) -> List[dict]:
        """
        Method returns the list all of connections of workflow
        """
        data = {"workspaceId": workflow_id}
        response = self.client.post("/connections/list", data=json.dumps(data))
        if response.get("exceptionStack"):
            raise APIError(response["message"])
        return response.get("connections")

    def list_jobs(self, connection_id: str) -> List[dict]:
        """
        Method returns the list all of jobs of a connection
        """
        data = {"configId": connection_id, "configTypes": ["sync", "reset_connection"]}
        response = self.client.post("/jobs/list", data=json.dumps(data))
        if response.get("exceptionStack"):
            raise APIError(response["message"])
        return response.get("jobs")

    def get_source(self, source_id: str) -> dict:
        """
        Method returns source details
        """
        data = {"sourceId": source_id}
        response = self.client.post("/sources/get", data=json.dumps(data))
        if response.get("exceptionStack"):
            raise APIError(response["message"])
        return response

    def get_destination(self, destination_id: str) -> dict:
        """
        Method returns destination details
        """
        data = {"destinationId": destination_id}
        response = self.client.post("/destinations/get", data=json.dumps(data))
        if response.get("exceptionStack"):
            raise APIError(response["message"])
        return response
