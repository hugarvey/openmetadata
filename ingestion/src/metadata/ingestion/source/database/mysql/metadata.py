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
"""Mysql source module"""
from typing import Optional, cast

from sqlalchemy.dialects.mysql.base import ischema_names
from sqlalchemy.dialects.mysql.reflection import MySQLTableDefinitionParser

from metadata.generated.schema.entity.services.connections.database.mysqlConnection import (
    MysqlConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.steps import InvalidSourceException
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.database.common_db_source import CommonDbSourceService
from metadata.ingestion.source.database.mysql.utils import col_type_map, parse_column
from metadata.utils.secrets.manage_ssl import SSLManager

ischema_names.update(col_type_map)


MySQLTableDefinitionParser._parse_column = (  # pylint: disable=protected-access
    parse_column
)


class MysqlSource(CommonDbSourceService):
    """
    Implements the necessary methods to extract
    Database metadata from Mysql Source
    """

    def __init__(self, config: WorkflowSource, metadata: OpenMetadata):
        self.ssl_manager = None
        service_connection = config.serviceConnection.__root__.config
        ssl = service_connection.ssl
        if ssl and (
            ssl.__root__.caCertificate
            or ssl.__root__.sslCertificate
            or ssl.__root__.sslKey
        ):
            self.ssl_manager = SSLManager(
                ca=ssl.__root__.caCertificate,
                cert=ssl.__root__.sslCertificate,
                key=ssl.__root__.sslKey,
            )

            service_connection = self.ssl_manager.setup_ssl(service_connection)
        super().__init__(config, metadata)

    @classmethod
    def create(
        cls, config_dict, metadata: OpenMetadata, pipeline_name: Optional[str] = None
    ):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection = cast(MysqlConnection, config.serviceConnection.__root__.config)
        if not isinstance(connection, MysqlConnection):
            raise InvalidSourceException(
                f"Expected MysqlConnection, but got {connection}"
            )
        return cls(config, metadata)
