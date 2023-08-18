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
Couchbase source methods.
"""

import traceback
from typing import Dict, Iterable, List

from metadata.generated.schema.entity.services.connections.database.couchbaseConnection import (
    CouchbaseConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.common_nosql_source import (
    SAMPLE_SIZE,
    CommonNoSQLSource,
)
from metadata.ingestion.source.database.couchbase.queries import (
    COUCHBASE_GET_DATA,
    COUCHBASE_SQL_STATEMENT,
)
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class CouchbaseSource(CommonNoSQLSource):
    """
    Implements the necessary methods to extract
    Database metadata from Dynamo Source
    """

    def __init__(self, config: WorkflowSource, metadata_config: OpenMetadataConnection):
        super().__init__(config, metadata_config)
        self.couchbase = self.connection_obj

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: CouchbaseConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, CouchbaseConnection):
            raise InvalidSourceException(
                f"Expected CouchbaseConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def get_database_names(self) -> Iterable[str]:
        if self.service_connection.bucket:
            yield self.service_connection.__dict__.get("bucket")
        else:
            buckets = self.couchbase.buckets()
            for bucket_name in buckets.get_all_buckets():
                yield bucket_name.name

    def get_schema_name_list(self) -> List[str]:
        """
        Method to get list of schema names available within NoSQL db
        need to be overridden by sources
        """
        try:
            database_name = self.context.database.name.__root__
            bucket = self.couchbase.bucket(database_name)
            collection_manager = bucket.collections()
            self.context.scope_dict = {
                scope.name: scope for scope in collection_manager.get_all_scopes()
            }
            return [scopes.name for scopes in collection_manager.get_all_scopes()]
        except Exception as exp:
            logger.debug(f"Failed to list database names: {exp}")
            logger.debug(traceback.format_exc())
        return []

    def get_table_name_list(self, schema_name: str) -> List[str]:
        """
        Method to get list of table names available within schema db
        need to be overridden by sources
        """
        try:
            scope_object = self.context.scope_dict.get(schema_name)
            return [collection.name for collection in scope_object.collections]
        except Exception as exp:
            logger.debug(
                f"Failed to list collection names for schema [{schema_name}]: {exp}"
            )
            logger.debug(traceback.format_exc())
        return []

    def get_table_columns_dict(self, schema_name: str, table_name: str) -> List[Dict]:
        """
        Method to get actual data available within table
        need to be overridden by sources
        """
        database_name = self.context.database.name.__root__
        query = COUCHBASE_SQL_STATEMENT.format(table_name=table_name)
        result = self.couchbase.query(query)
        for row in result.rows():
            if len(row) > 0:
                query_coln = COUCHBASE_GET_DATA.format(
                    database_name=database_name,
                    schema_name=schema_name,
                    table_name=table_name,
                    sample_size=SAMPLE_SIZE,
                )
                query_iter = self.couchbase.query(query_coln)
                return list(query_iter.rows())
        return []
