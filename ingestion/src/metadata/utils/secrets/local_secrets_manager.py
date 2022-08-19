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
Secrets manager implementation for local secrets manager
"""
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
    SecretsManagerProvider,
)
from metadata.generated.schema.entity.services.connections.serviceConnection import (
    ServiceConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import SourceConfig
from metadata.utils.secrets.secrets_manager import (
    SecretsManager,
    ServiceWithConnectionType,
    logger,
)


class LocalSecretsManager(SecretsManager):
    """
    LocalSecretsManager is used when there is not a secrets' manager configured.
    """

    provider: str = SecretsManagerProvider.local.name

    def add_auth_provider_security_config(
        self, open_metadata_connection: OpenMetadataConnection
    ) -> None:
        """
        The LocalSecretsManager does not modify the OpenMetadataConnection object
        """
        logger.debug(
            f"Adding auth provider security config using {self.provider} secrets' manager"
        )
        return None

    def retrieve_service_connection(
        self,
        service: ServiceWithConnectionType,
        service_type: str,
    ) -> ServiceConnection:
        """
        The LocalSecretsManager does not modify the ServiceConnection object
        """
        logger.debug(
            f"Retrieving service connection from {self.provider} secrets' manager for {service_type} - {service.name}"
        )
        return ServiceConnection(__root__=service.connection)

    def retrieve_dbt_source_config(
        self, source_config: SourceConfig, pipeline_name: str
    ) -> object:
        """
        Retrieve the DBT source config from the secret manager from a source config object.
        :param source_config: SourceConfig object
        :param pipeline_name: the pipeline's name
        :return:
        """
        logger.debug(
            f"Retrieving source_config from {self.provider} secrets' manager for {pipeline_name}"
        )
        return (
            source_config.config.dbtConfigSource.dict()
            if source_config
            and source_config.config
            and source_config.config.dbtConfigSource
            else None
        )
