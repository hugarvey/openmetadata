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
import traceback
from typing import cast, Tuple, Iterable, Optional, List, Dict
import re
from metadata.generated.schema.entity.data.table import TableType
from sqlalchemy.dialects.mysql.reflection import MySQLTableDefinitionParser
from sqlalchemy import sql
from sqlalchemy.engine.reflection import Inspector
from metadata.generated.schema.entity.services.connections.database.dorisConnection import (
    DorisConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.entity.data.table import (
    Column,
    TablePartition,
    DataType,
    TableConstraint,
    IntervalType,
)
from metadata.ingestion.api.steps import InvalidSourceException
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.database.common_db_source import CommonDbSourceService, TableNameAndType
from metadata.ingestion.source.database.mysql.utils import parse_column
from metadata.ingestion.source.database.doris.queries import DORIS_GET_TABLE_NAMES, DORIS_SHOW_FULL_COLUMNS, \
    DORIS_PARTITION_DETAILS
from metadata.ingestion.source.database.doris.utils import (
    get_table_names_and_type,
    get_table_comment
)
from pydoris.sqlalchemy.dialect import DorisDialect
from pydoris.sqlalchemy import datatype

MySQLTableDefinitionParser._parse_column = (  # pylint: disable=protected-access
    parse_column
)

RELKIND_MAP = {
    "Doris": TableType.Regular,
    "View": TableType.View,
    "MEMORY": TableType.View,
}

DorisDialect.get_table_names_and_type = get_table_names_and_type
DorisDialect.get_table_comment = get_table_comment
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


def extract_number(data):
    """
    extract data type length for CHAR, VARCHAR, DECIMAL, such as CHAR(1), return ['1'],
    DECIMAL[9,0] return ['9', '0']
    """
    result = re.findall(r'\((.*?)\)', data)
    if result:
        result = result[0].split(", ")
        return result
    else:
        return []


def extract_child(data):
    """
    extract_child for ARRAY and Struct, such as ARRAY<INT(11)>, then return INT(11)
    """
    result = re.findall(r'(?<=<).+(?=>)', data)
    return result[0]


class DorisSource(CommonDbSourceService):
    """
    Implements the necessary methods to extract
    Database metadata from Mysql Source
    """

    @classmethod
    def create(cls, config_dict, metadata: OpenMetadata):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        if config.serviceConnection is None:
            raise InvalidSourceException("Missing service connection")
        connection = cast(DorisConnection, config.serviceConnection.__root__.config)
        if not isinstance(connection, DorisConnection):
            raise InvalidSourceException(
                f"Expected DorisConnection, but got {connection}"
            )
        return cls(config, metadata)

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
        tables = [
            TableNameAndType(name=name, type_=RELKIND_MAP.get(engine))
            for name, engine in self.connection.execute(sql.text(DORIS_GET_TABLE_NAMES), {"schema": schema_name}) or []
        ]
        return tables

    @staticmethod
    def get_table_description(
            schema_name: str, table_name: str, inspector: Inspector
    ) -> str:
        description = None
        try:
            table_info: dict = inspector.get_table_comment(table_name, schema_name)
        # Catch any exception without breaking the ingestion
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(
                f"Table description error for table [{schema_name}.{table_name}]: {exc}"
            )
        else:
            description = table_info.get("text")

        return description[0]

    def _get_columns(
            self, table_name, schema=None, **kw
    ):
        """
        Overriding the dialect method to add raw_data_type in response
        """

        def _parse_type(_type):
            """
            parse raw type to system_data_type like CHAR(1) -> CHAR, STRUCT<s_id:int(11),s_name:text> -> STRUCT,
            DECIMALV3(9, 0) -> DECIMAL, DATEV2 -> DATE
            """
            parse_type = _type.split('(')[0].split('<')[0]
            if parse_type[-2] == 'v':
                system_data_type = parse_type.split('v')[0].upper()
            else:
                system_data_type = parse_type.upper()
            return system_data_type

        def _get_column(i, Field, Type, Null, Default, Comment):
            _type = Type.lower()
            system_data_type = _parse_type(_type)
            data_type = datatype.parse_sqltype(Type)
            if system_data_type in ['VARCHAR', 'CHAR']:
                data_type.length = extract_number(Type)[0]
            if system_data_type == 'DECIMAL':
                number = extract_number(Type)
                if len(number) == 2:
                    data_type.precision = number[0]
                    data_type.scale = number[1]
            arr_data_type = None
            children = None
            if system_data_type == 'ARRAY':
                arr_data_type = _parse_type(extract_child(_type))
            if system_data_type == 'STRUCT':
                children = []
                for k, child in enumerate(extract_child(_type).split(',')):
                    name_type = child.split(':')
                    children.append(_get_column(k, name_type[0], name_type[1], 'YES', None, None))
            return {'name': Field,
                    'default': Default,
                    'nullable': True if Null == "YES" else None,
                    'type': Type,
                    'data_type': data_type,
                    'display_type': Type.lower(),
                    'system_data_type': system_data_type,
                    'comment': Comment,
                    'ordinalPosition': i,
                    'arr_data_type': arr_data_type,
                    'children': children}

        table_columns = []
        primary_columns = []
        rows = self.connection.execute(sql.text(DORIS_SHOW_FULL_COLUMNS.format(schema, table_name)))
        for i, (Field, Type, Collation, Null, Key, Default, Extra, Privileges, Comment) in enumerate(rows):
            table_columns.append(_get_column(i, Field, Type, Null, Default, Comment))
            if Key == 'YES':
                primary_columns.append(Field)

        return table_columns, primary_columns

    def get_columns_and_constraints(  # pylint: disable=too-many-locals
            self, schema_name: str, table_name: str, db_name: str, inspector: Inspector
    ) -> Tuple[
        Optional[List[Column]], Optional[List[TableConstraint]], Optional[List[Dict]]
    ]:
        """
        :param schema_name:
        :param table_name:
        :param db_name:
        :param inspector:
        :return:
        """
        table_constraints = []
        foreign_columns = []
        table_columns = []
        columns, primary_columns = self._get_columns(table_name, schema_name)
        for column in columns:
            try:
                children = None
                if column['children']:
                    children = [Column(
                        name=child["name"] if child["name"] else " ",
                        description=child.get("comment"),
                        dataType=child["system_data_type"],
                        dataTypeDisplay=child['display_type'],
                        dataLength=self._check_col_length(child["system_data_type"], child['data_type']),
                        constraint=None,
                        children=child['children'],
                        arrayDataType=child['arr_data_type'],
                        ordinalPosition=child.get("ordinalPosition"),
                    ) for child in column['children']]
                data_type_display = column.get('type')
                self.process_additional_table_constraints(
                    column=column, table_constraints=table_constraints
                )

                col_type = column["system_data_type"]
                col_constraint = self._get_column_constraints(
                    column, primary_columns, []
                )
                col_data_length = self._check_col_length(column["system_data_type"], col_type)
                if col_data_length is None:
                    col_data_length = 1
                if col_type is None:
                    col_type = DataType.UNKNOWN.name
                    data_type_display = col_type.lower()
                    logger.warning(
                        f"Unknown type {repr(column['type'])}: {column['name']}"
                    )
                om_column = Column(
                    name=column["name"] if column["name"] else " ",
                    description=column.get("comment"),
                    dataType=column["system_data_type"],
                    dataTypeDisplay=data_type_display,
                    dataLength=col_data_length,
                    constraint=col_constraint,
                    children=children,
                    arrayDataType=column['arr_data_type'],
                    ordinalPosition=column.get("ordinalPosition"),
                )
                if column['system_data_type'] == 'DECIMAL':
                    om_column.precision = column['data_type'].precision
                    om_column.scale = column['data_type'].scale

                om_column.tags = self.get_column_tag_labels(
                    table_name=table_name, column=column
                )
            except Exception as exc:
                logger.debug(traceback.format_exc())
                logger.warning(
                    f"Unexpected exception processing column [{column}]: {exc}"
                )
                continue
            table_columns.append(om_column)
        return table_columns, [], foreign_columns

    def get_table_partition_details(  # pylint: disable=unused-argument
            self,
            table_name: str,
            schema_name: str,
            inspector: Inspector,
    ) -> Tuple[bool, Optional[TablePartition]]:
        """
        check if the table is partitioned table and return the partition details
        """
        result = self.engine.execute(sql.text(DORIS_PARTITION_DETAILS.format(schema_name, table_name))).all()

        if result and result[0].PartitionKey != '':
            partition_details = TablePartition(
                intervalType=IntervalType.TIME_UNIT.value,
                columns=result[0].PartitionKey.split(', '),
            )
            return True, partition_details
        return False, None
