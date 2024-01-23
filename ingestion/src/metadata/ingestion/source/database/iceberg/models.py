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
Iceberg source models.
"""
from __future__ import annotations
from typing import Optional, List

from pydantic import BaseModel

import pyiceberg.table

from metadata.generated.schema.entity.data.table import (
    Column,
    TablePartition,
    TableType,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.source.database.iceberg.helper import (
    get_column_from_partition,
    IcebergColumnParser,
)


class IcebergTable(BaseModel):
    name: str
    tableType: TableType
    description: Optional[str]
    owner: Optional[EntityReference]
    columns: List[Column] = []
    tablePartition: Optional[TablePartition]

    @classmethod
    def from_pyiceberg(
        cls,
        name: str,
        table_type: TableType,
        owner: Optional[EntityReference],
        table: pyiceberg.table.Table
    ) -> IcebergTable:
        """ Responsible for parsing the needed information from a PyIceberg Table. """
        iceberg_columns = table.schema().fields

        return IcebergTable(
            name=name,
            tableType=table_type,
            description=table.properties.get("comment"),
            owner=owner,
            columns=[
                IcebergColumnParser.parse(column)
                for column in iceberg_columns
            ],
            tablePartition=TablePartition(
                columns=[
                    get_column_from_partition(iceberg_columns, partition)
                    for partition in table.spec().fields
                ],
                intervalType=None,
                interval=None
            )
        )
