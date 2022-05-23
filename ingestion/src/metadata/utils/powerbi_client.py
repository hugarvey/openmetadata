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
import traceback

import msal

from metadata.ingestion.ometa.client import REST, ClientConfig
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class PowerBiApiClient:
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

    def get_auth_token(self):
        logger.info("Generating PowerBi access token")
        auth_response = self.msal_client.acquire_token_for_client(
            scopes=self.config.scope
        )

        if not auth_response.get("access_token"):
            logger.error(
                "Failed to generate the PowerBi access token. Please check provided config"
            )
            raise Exception(
                "Failed to generate the PowerBi access token. Please check provided config"
            )

        logger.info("PowerBi Access Token generated successfully")
        access_token = auth_response.get("access_token")
        expiry = auth_response.get("expires_in")

        return access_token, expiry

    def fetch_charts(self, dashboard_id: str):
        """Get charts method

        Args:
            dashboard_id:
        Returns:
            Iterable[Chart]
        """
        try:
            response = self.client.get(f"/myorg/dashboards/{dashboard_id}/tiles")
            return response
        except Exception as err:  # pylint: disable=broad-except
            logger.error(repr(err))
            logger.debug(traceback.format_exc())

    def fetch_dashboards(self):
        """Get dashboards method

        Returns:
            Iterable[Chart]
        """
        try:
            response = self.client.get(f"/myorg/dashboards")
            return response
        except Exception as err:  # pylint: disable=broad-except
            logger.error(repr(err))
            logger.debug(traceback.format_exc())
