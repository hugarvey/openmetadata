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
Databricks Source Model module
"""

from typing import List, Optional

from pydantic import BaseModel


class DatabricksTable(BaseModel):
    name: Optional[str]
    catalog_name: Optional[str]
    schema_name: Optional[str]


class DatabricksColumn(BaseModel):
    name: Optional[str]
    catalog_name: Optional[str]
    schema_name: Optional[str]
    table_name: Optional[str]


class LineageTableStreams(BaseModel):
    upstream_tables: Optional[List[DatabricksTable]] = []
    downstream_tables: Optional[List[DatabricksTable]] = []


class LineageColumnStreams(BaseModel):
    upstream_cols: Optional[List[DatabricksColumn]] = []
    downstream_cols: Optional[List[DatabricksColumn]] = []
