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

import logging
import sys

import click
from sqlalchemy.engine.reflection import Inspector

from metadata.generated.schema.entity.data.database import Database
from metadata.generated.schema.entity.data.databaseSchema import DatabaseSchema
from metadata.generated.schema.entity.services.connections.database.trinoConnection import (
    TrinoConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.common_db_source import CommonDbSourceService
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class TrinoSource(CommonDbSourceService):
    def __init__(self, config, metadata_config):
        self.trino_connection: TrinoConnection = (
            config.serviceConnection.__root__.config
        )
        try:
            from trino import (
                dbapi,  # pylint: disable=import-outside-toplevel,unused-import
            )
        except ModuleNotFoundError:
            click.secho(
                "Trino source dependencies are missing. Please run\n"
                + "$ pip install --upgrade 'openmetadata-ingestion[trino]'",
                fg="red",
            )
            if logger.isEnabledFor(logging.DEBUG):
                raise
            sys.exit(1)
        super().__init__(config, metadata_config)

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config = WorkflowSource.parse_obj(config_dict)
        connection: TrinoConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, TrinoConnection):
            raise InvalidSourceException(
                f"Expected TrinoConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def get_database_entity(self) -> Database:
        return Database(
            name=self.trino_connection.catalog,
            service=EntityReference(
                id=self.service.id, type=self.service_connection.type.value
            ),
        )

    def get_schema_names(self) -> str:
        return (
            self.inspector.get_schema_names()
            if not self.service_connection.databaseSchema
            else [self.service_connection.databaseSchema]
        )
