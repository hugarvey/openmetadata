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
PGSpider Query parser module
"""
from abc import ABC

from metadata.generated.schema.entity.services.connections.database.pgspiderConnection import (
    PGSpiderConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.postgres.query_parser import (
    PostgresQueryParserSource,
)


class PGSpiderQueryParserSource(PostgresQueryParserSource, ABC):
    """
    PGSpider base for Usage and Lineage
    """

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: PGSpiderConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, PGSpiderConnection):
            raise InvalidSourceException(
                f"Expected PGSpiderConnection, but got {connection}"
            )
        return cls(config, metadata_config)