# generated by datamodel-codegen:
#   filename:  schema/api/data/createTable.json
#   timestamp: 2021-08-19T22:32:24+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from ...entity.data import table
from ...type import basic, entityReference, tagLabel


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
    viewDefinition: Optional[basic.SqlQuery] = Field(
        None, description='View Definition in SQL. Applies to TableType.View only'
    )
