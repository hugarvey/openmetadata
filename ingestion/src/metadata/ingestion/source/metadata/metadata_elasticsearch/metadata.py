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
"""Metadata source module"""

from metadata.generated.schema.entity.services.connections.metadata.metadataESConnection import (
    MetadataESConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)

from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.metadata.metadata import MetadataSource
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class MetadataElasticsearchSource(MetadataSource):
    """
    Metadata Elasticsearch Source
    Used for metadata to ES pipeline
    """

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: MetadataESConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, MetadataESConnection):
            raise InvalidSourceException(
                f"Expected MetadataESConnection, but got {connection}"
            )
        return cls(config, metadata_config)
