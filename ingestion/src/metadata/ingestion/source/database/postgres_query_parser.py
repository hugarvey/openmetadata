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
Postgres Query parser module
"""
import traceback
from abc import ABC
from datetime import datetime, timedelta
from typing import Iterable, Optional

from sqlalchemy.engine.base import Engine

from metadata.generated.schema.entity.services.connections.database.postgresConnection import (
    PostgresConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.tableQuery import TableQueries, TableQuery
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.query_parser_source import QueryParserSource
from metadata.utils.connections import get_connection
from metadata.utils.filters import filter_by_database, filter_by_schema
from metadata.utils.helpers import get_start_and_end
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class PostgresQueryParserSource(QueryParserSource, ABC):
    """
    Postgres base for Usage and Lineage
    """

    def __init__(self, config: WorkflowSource, metadata_config: OpenMetadataConnection):
        super().__init__(config, metadata_config)

        # Postgres does not allow retrieval of data older than 7 days
        # Update start and end based on this
        duration = min(self.source_config.queryLogDuration, 6)
        self.start, self.end = get_start_and_end(duration)

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: PostgresConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, PostgresConnection):
            raise InvalidSourceException(
                f"Expected PostgresConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def get_sql_statement(self, start_time: datetime, end_time: datetime) -> str:
        """
        returns sql statement to fetch query logs
        """
        return self.sql_stmt.format(
            start_time=start_time,
            end_time=end_time,
            result_limit=self.config.sourceConfig.config.resultLimit,
        )

    def get_table_query(self) -> Iterable[TableQuery]:
        database = self.config.serviceConnection.__root__.config.database
        if database:
            self.engine: Engine = get_connection(self.connection)
            yield from self.process_table_query()
        else:
            query = "select datname from pg_catalog.pg_database"
            results = self.engine.execute(query)
            for res in results:
                row = list(res)
                logger.info(f"Ingesting from database: {row[0]}")
                self.config.serviceConnection.__root__.config.database = row[0]
                self.engine = get_connection(self.connection)
                yield from self.process_table_query()

    def process_table_query(self) -> Optional[Iterable[TableQuery]]:
        daydiff = self.end - self.start
        for i in range(daydiff.days):
            logger.info(
                f"Scanning query logs for {(self.start + timedelta(days=i)).date()} - "
                f"{(self.start + timedelta(days=i+1)).date()}"
            )
            try:
                with get_connection(self.connection).connect() as conn:
                    rows = conn.execute(
                        self.get_sql_statement(
                            start_time=self.start + timedelta(days=i),
                            end_time=self.start + timedelta(days=i + 2),
                        )
                    )
                    queries = []
                    for row in rows:
                        row = dict(row)
                        try:
                            if filter_by_database(
                                self.source_config.databaseFilterPattern,
                                self.get_database_name(row),
                            ) or filter_by_schema(
                                self.source_config.schemaFilterPattern,
                                schema_name=row.get("schema_name"),
                            ):
                                continue

                            end_time = row["start_time"] + timedelta(
                                milliseconds=row["total_exec_time"]
                            )
                            date_time = end_time.strftime("%m/%d/%Y, %H:%M:%S")
                            queries.append(
                                TableQuery(
                                    query=row["query_text"],
                                    userName=row["usename"],
                                    startTime=str(row["start_time"]),
                                    endTime=date_time,
                                    analysisDate=row["start_time"],
                                    aborted=self.get_aborted_status(row),
                                    databaseName=self.get_database_name(row),
                                    serviceName=self.config.serviceName,
                                    databaseSchema=self.get_schema_name(row),
                                )
                            )
                        except Exception as err:
                            logger.debug(traceback.format_exc())
                            logger.error(str(err))
                yield TableQueries(queries=queries)
            except Exception as err:
                logger.error(f"Source usage processing error - {err}")
                logger.debug(traceback.format_exc())

    def next_record(self) -> Iterable[TableQuery]:
        for table_queries in self.get_table_query():
            if table_queries:
                yield table_queries

    def get_database_name(self, data: dict) -> str:
        """
        Method to get database name
        """
        if not data["datname"] and self.connection.database:
            return self.connection.database
        return data["datname"]
