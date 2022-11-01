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
REST Auth & Client for PowerBi
"""
import json
import traceback
from typing import List, Optional, Tuple

import msal

from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.ometa.client import REST, ClientConfig
from metadata.utils.logger import utils_logger

logger = utils_logger()


# Similar inner methods with mode client. That's fine.
# pylint: disable=duplicate-code
class PowerBiApiClient:
    """
    REST Auth & Client for PowerBi
    """

    client: REST

    def __init__(self, config):
        self.config = config
        self.msal_client = msal.ConfidentialClientApplication(
            client_id=self.config.clientId,
            client_credential=self.config.clientSecret.get_secret_value(),
            authority=self.config.authorityURI + self.config.tenantId,
        )
        self.auth_token = self.get_auth_token()
        client_config = ClientConfig(
            base_url="https://api.powerbi.com",
            api_version="v1.0",
            auth_token=lambda: self.auth_token,
            auth_header="Authorization",
            allow_redirects=True,
        )
        self.client = REST(client_config)

    def get_auth_token(self) -> Tuple[str, str]:
        """
        Method to generate PowerBi access token
        """
        logger.info("Generating PowerBi access token")

        auth_response = self.msal_client.acquire_token_silent(
            scopes=self.config.scope, account=None
        )

        if not auth_response:
            logger.info("Token does not exist in the cache. Getting a new token.")
            auth_response = self.msal_client.acquire_token_for_client(
                scopes=self.config.scope
            )

        if not auth_response.get("access_token"):
            raise InvalidSourceException(
                "Failed to generate the PowerBi access token. Please check provided config"
            )

        logger.info("PowerBi Access Token generated successfully")
        access_token = auth_response.get("access_token")
        expiry = auth_response.get("expires_in")

        return access_token, expiry

    def fetch_dashboards(self) -> Optional[dict]:
        """Get dashboards method
        Returns:
            dict
        """
        try:
            response = self.client.get("/myorg/admin/dashboards")
            return response
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error fetching dashboards: {exc}")

        return None

    def fetch_all_workspaces(self) -> Optional[dict]:
        """Method to fetch all powerbi workspace details
        Returns:
            dict
        """
        try:
            params_data = {"$top": "50"}
            response = self.client.get("/myorg/admin/groups", data=params_data)
            return response
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error fetching workspaces: {exc}")

        return None

    def initiate_workspace_scan(self, workspace_ids: List[str]) -> Optional[dict]:
        """Method to initiate workspace scan
        Args:
            workspace_ids:
        Returns:
            dict
        """
        try:
            data = json.dumps({"workspaces": workspace_ids})
            path = (
                "/myorg/admin/workspaces/getInfo?"
                "datasetExpressions=True&datasetSchema=True"
                "&datasourceDetails=True&getArtifactUsers=True&lineage=True"
            )
            response = self.client.post(path=path, data=data)
            return response
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error initiating workspace scan: {exc}")

        return None

    def fetch_workspace_scan_status(self, scan_id: str) -> Optional[dict]:
        """Get Workspace scan status by id method
        Args:
            scan_id:
        Returns:
            dict
        """
        try:
            response = self.client.get(f"/myorg/admin/workspaces/scanStatus/{scan_id}")
            return response
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error fetching workspace scan status: {exc}")

        return None

    def fetch_workspace_scan_result(self, scan_id: str) -> Optional[dict]:
        """Get Workspace scan result by id method
        Args:
            scan_id:
        Returns:
            dict
        """
        try:
            response = self.client.get(f"/myorg/admin/workspaces/scanResult/{scan_id}")
            return response
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error fetching workspace scan result: {exc}")

        return None
