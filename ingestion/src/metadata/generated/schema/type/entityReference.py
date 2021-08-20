# generated by datamodel-codegen:
#   filename:  schema/type/entityReference.json
#   timestamp: 2021-08-19T22:32:24+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from . import basic


class EntityReference(BaseModel):
    id: basic.Uuid = Field(
        ..., description='Unique identifier that identifies an entity instance.'
    )
    type: str = Field(
        ...,
        description='Entity type/class name - Examples: `database`, `table`, `metrics`, `redshift`, `mysql`, `bigquery`, `snowflake`...',
    )
    name: Optional[str] = Field(
        None,
        description='Name of the entity instance. For entities such as tables, database where name is not unique, fullyQualifiedName is returned in this field.',
    )
    description: Optional[str] = Field(
        None, description='Optional description of entity.'
    )
    href: Optional[basic.Href] = Field(None, description='Link to the entity resource.')


class EntityReferenceList(BaseModel):
    __root__: List[EntityReference]
