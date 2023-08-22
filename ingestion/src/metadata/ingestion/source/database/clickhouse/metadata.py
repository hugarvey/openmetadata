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
"""Clickhouse source module"""

import traceback
from typing import Iterable, Optional

from clickhouse_sqlalchemy.drivers.base import ClickHouseDialect, ischema_names
from clickhouse_sqlalchemy.drivers.http.transport import RequestsTransport, _get_type
from clickhouse_sqlalchemy.drivers.http.utils import parse_tsv
from clickhouse_sqlalchemy.types import Date
from sqlalchemy import text
from sqlalchemy import types as sqltypes
from sqlalchemy.engine import Inspector, reflection
from sqlalchemy.util import warn

from metadata.generated.schema.entity.data.table import TableType
from metadata.generated.schema.entity.services.connections.database.clickhouseConnection import (
    ClickhouseConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.database.clickhouse.queries import (
    CLICKHOUSE_TABLE_COMMENTS,
    CLICKHOUSE_VIEW_DEFINITIONS,
)
from metadata.ingestion.source.database.clickhouse.utils import (
    get_mview_names,
    get_mview_names_dialect,
)
from metadata.ingestion.source.database.column_type_parser import create_sqlalchemy_type
from metadata.ingestion.source.database.common_db_source import (
    CommonDbSourceService,
    TableNameAndType,
)
from metadata.utils.logger import ingestion_logger
from metadata.utils.sqlalchemy_utils import (
    get_all_table_comments,
    get_all_view_definitions,
    get_table_comment_wrapper,
    get_view_definition_wrapper,
)

logger = ingestion_logger()

Map = create_sqlalchemy_type("Map")
Array = create_sqlalchemy_type("Array")
Enum = create_sqlalchemy_type("Enum")
Tuple = create_sqlalchemy_type("Tuple")
BIGINT = create_sqlalchemy_type("BIGINT")
SMALLINT = create_sqlalchemy_type("SMALLINT")
INTEGER = create_sqlalchemy_type("INTEGER")

ischema_names.update(
    {
        "AggregateFunction": create_sqlalchemy_type("AggregateFunction"),
        "Map": Map,
        "Array": Array,
        "Tuple": Tuple,
        "Enum": Enum,
        "Date32": Date,
        "SimpleAggregateFunction": create_sqlalchemy_type("SimpleAggregateFunction"),
        "Int256": BIGINT,
        "Int128": BIGINT,
        "Int64": BIGINT,
        "Int32": INTEGER,
        "Int16": SMALLINT,
        "Int8": SMALLINT,
        "UInt256": BIGINT,
        "UInt128": BIGINT,
        "UInt64": BIGINT,
        "UInt32": INTEGER,
        "UInt16": SMALLINT,
        "UInt8": SMALLINT,
        "IPv4": create_sqlalchemy_type("IPv4"),
        "IPv6": create_sqlalchemy_type("IPv6"),
    }
)


@reflection.cache
def _get_column_type(
    self, name, spec
):  # pylint: disable=protected-access,too-many-branches,too-many-return-statements
    if spec.startswith("Array"):
        return self.ischema_names["Array"]

    if spec.startswith("FixedString"):
        return self.ischema_names["FixedString"]

    if spec.startswith("Nullable"):
        inner = spec[9:-1]
        coltype = self.ischema_names["_nullable"]
        return self._get_column_type(name, inner)

    if spec.startswith("LowCardinality"):
        inner = spec[15:-1]
        coltype = self.ischema_names["_lowcardinality"]
        return coltype(self._get_column_type(name, inner))

    if spec.startswith("Tuple"):
        return self.ischema_names["Tuple"]

    if spec.startswith("Map"):
        return self.ischema_names["Map"]

    if spec.startswith("Enum"):
        return self.ischema_names["Enum"]

    if spec.startswith("DateTime64"):
        return self.ischema_names["DateTime64"]

    if spec.startswith("DateTime"):
        return self.ischema_names["DateTime"]

    if spec.lower().startswith("decimal"):
        coltype = self.ischema_names["Decimal"]
        return coltype(*self._parse_decimal_params(spec))

    if spec.lower().startswith("aggregatefunction"):
        return self.ischema_names["AggregateFunction"]

    if spec.lower().startswith("simpleaggregatefunction"):
        return self.ischema_names["SimpleAggregateFunction"]
    try:
        return self.ischema_names[spec]
    except KeyError:
        warn(f"Did not recognize type '{spec}' of column '{name}'")
        return sqltypes.NullType


def execute(self, query, params=None):
    """
    Query is returning rows and these rows should be parsed or
    there is nothing to return.
    """
    req = self._send(  # pylint: disable=protected-access
        query, params=params, stream=True
    )
    lines = req.iter_lines()
    try:
        names = parse_tsv(next(lines), self.unicode_errors)
        types = parse_tsv(next(lines), self.unicode_errors)
    except StopIteration:
        # Empty result; e.g. a DDL request.
        return

    convs = [_get_type(type_) for type_ in types if type_]

    yield names
    yield types

    for line in lines:
        yield [
            (conv(x) if conv else x)
            for x, conv in zip(parse_tsv(line, self.unicode_errors), convs)
        ]


@reflection.cache
def get_unique_constraints(
    self, connection, table_name, schema=None, **kw
):  # pylint: disable=unused-argument
    return []


@reflection.cache
def get_pk_constraint(
    self, bind, table_name, schema=None, **kw  # pylint: disable=unused-argument
):
    return {"constrained_columns": [], "name": "undefined"}


@reflection.cache
def get_view_definition(
    self, connection, table_name, schema=None, **kw  # pylint: disable=unused-argument
):
    return get_view_definition_wrapper(
        self,
        connection,
        table_name=table_name,
        schema=schema,
        query=CLICKHOUSE_VIEW_DEFINITIONS,
    )


@reflection.cache
def get_view_names(
    self, connection, schema=None, **kw  # pylint: disable=unused-argument
):
    query = text(
        "SELECT name FROM system.tables WHERE engine = 'View' "
        "AND database = :database"
    )
    database = schema or connection.engine.url.database
    rows = self._execute(  # pylint: disable=protected-access
        connection, query, database=database
    )
    return [row.name for row in rows]


@reflection.cache
def get_table_comment(
    self, connection, table_name, schema=None, **kw  # pylint: disable=unused-argument
):
    return get_table_comment_wrapper(
        self,
        connection,
        table_name=table_name,
        schema=schema,
        query=CLICKHOUSE_TABLE_COMMENTS,
    )


def _get_column_info(
    self, name, format_type, default_type, default_expression, comment
):
    col_type = self._get_column_type(  # pylint: disable=protected-access
        name, format_type
    )
    col_default = self._get_column_default(  # pylint: disable=protected-access
        default_type, default_expression
    )

    raw_type = format_type.lower().replace("(", "<").replace(")", ">")
    result = {
        "name": name,
        "type": col_type,
        "nullable": format_type.startswith("Nullable("),
        "default": col_default,
        "comment": comment or None,
        "system_data_type": raw_type,
    }

    if col_type in [Map, Array, Tuple, Enum]:
        result["display_type"] = raw_type

    if col_type == Array:
        result["is_complex"] = True
    return result


ClickHouseDialect.get_unique_constraints = get_unique_constraints
ClickHouseDialect.get_pk_constraint = get_pk_constraint
ClickHouseDialect._get_column_type = (  # pylint: disable=protected-access
    _get_column_type
)
RequestsTransport.execute = execute
ClickHouseDialect.get_view_definition = get_view_definition
ClickHouseDialect.get_view_names = get_view_names
ClickHouseDialect.get_table_comment = get_table_comment
ClickHouseDialect.get_all_view_definitions = get_all_view_definitions
ClickHouseDialect.get_all_table_comments = get_all_table_comments
ClickHouseDialect._get_column_info = (  # pylint: disable=protected-access
    _get_column_info
)
Inspector.get_mview_names = get_mview_names
Inspector.get_all_view_definitions = get_all_view_definitions
ClickHouseDialect.get_mview_names = get_mview_names_dialect


class ClickhouseSource(CommonDbSourceService):
    """
    Implements the necessary methods to extract
    Database metadata from Clickhouse Source
    """

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: ClickhouseConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, ClickhouseConnection):
            raise InvalidSourceException(
                f"Expected ClickhouseConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def query_table_names_and_types(
        self, schema_name: str
    ) -> Iterable[TableNameAndType]:
        """
        Connect to the source database to get the table
        name and type. By default, use the inspector method
        to get the names and pass the Regular type.

        This is useful for sources where we need fine-grained
        logic on how to handle table types, e.g., external, foreign,...
        """

        regular_tables = [
            TableNameAndType(name=table_name)
            for table_name in self.inspector.get_table_names(schema_name) or []
        ]
        material_tables = [
            TableNameAndType(name=table_name, type_=TableType.MaterializedView)
            for table_name in self.inspector.get_mview_names(schema_name) or []
        ]
        view_tables = [
            TableNameAndType(name=table_name, type_=TableType.View)
            for table_name in self.inspector.get_view_names(schema_name) or []
        ]

        return regular_tables + material_tables + view_tables

    def get_view_definition(
        self, table_type: str, table_name: str, schema_name: str, inspector: Inspector
    ) -> Optional[str]:
        if table_type in {TableType.View, TableType.MaterializedView}:
            definition_fn = inspector.get_view_definition
            try:
                view_definition = definition_fn(table_name, schema_name)
                view_definition = (
                    "" if view_definition is None else str(view_definition)
                )
                return view_definition

            except NotImplementedError:
                logger.warning("View definition not implemented")

            except Exception as exc:
                logger.debug(traceback.format_exc())
                logger.warning(
                    f"Failed to fetch view definition for {table_name}: {exc}"
                )
            return None
        return None
