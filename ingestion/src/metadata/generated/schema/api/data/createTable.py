#  Licensed to the Apache Software Foundation (ASF) under one or more
#  contributor license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright ownership.
#  The ASF licenses this file to You under the Apache License, Version 2.0
#  (the "License"); you may not use this file except in compliance with
#  the License. You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# generated by datamodel-codegen:
#   filename:  schema/api/data/createTable.json
#   timestamp: 2021-07-31T17:12:10+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from metadata.generated.schema.entity.data import table
from metadata.generated.schema.type import basic, entityReference, tagLabel


class CreateTableEntityRequest(BaseModel):
    name: table.TableName = Field(
        ...,
        description='Name that identifies the this entity instance uniquely. Same as id if when name is not unique',
    )
    description: Optional[str] = Field(
        None, description='Description of entity instance.'
    )
    tableType: Optional[table.TableType] = None
    columns: List[table.Column] = Field(
        ..., description='Name of the tables in the database'
    )
    tableConstraints: Optional[List[table.TableConstraint]] = None
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this entity'
    )
    database: basic.Uuid = Field(
        ..., description='Database corresponding to this table'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this table'
    )
