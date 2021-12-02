# generated by datamodel-codegen:
#   filename:  schema/entity/data/model.json
#   timestamp: 2021-12-02T03:29:40+00:00

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Extra, Field, constr

from ...type import basic, entityHistory, entityReference, tagLabel, usageDetails
from . import table


class NodeType(Enum):
    Seed = 'Seed'
    Model = 'Model'


class CatalogType(Enum):
    BaseTable = 'BaseTable'


class MaterializationType(Enum):
    Table = 'Table'
    Seed = 'Seed'


class ModelName(BaseModel):
    __root__: constr(regex=r'^[^.]*$', min_length=1, max_length=64) = Field(
        ..., description='Local name (not fully qualified name) of a table.'
    )


class FullyQualifiedColumnName(BaseModel):
    __root__: constr(min_length=1, max_length=256) = Field(
        ...,
        description='Fully qualified name of the column that includes `serviceName.databaseName.tableName.columnName[.nestedColumnName]`. When columnName is null for dataType struct fields, `field_#` where `#` is field index is used. For map dataType, for key the field name `key` is used and for the value field `value` is used.',
    )


class Model(BaseModel):
    class Config:
        extra = Extra.forbid

    id: basic.Uuid = Field(..., description='Unique identifier of this model instance.')
    name: ModelName = Field(
        ..., description='Name of a model. Expected to be unique within a database.'
    )
    displayName: Optional[str] = Field(
        None,
        description='Display Name that identifies this model. It could be title or label from the source services.',
    )
    fullyQualifiedName: Optional[str] = Field(
        None,
        description='Fully qualified name of a model in the form `serviceName.databaseName.modelName`.',
    )
    description: Optional[str] = Field(None, description='Description of a model.')
    version: Optional[entityHistory.EntityVersion] = Field(
        None, description='Metadata version of the entity.'
    )
    updatedAt: Optional[basic.DateTime] = Field(
        None,
        description='Last update time corresponding to the new version of the entity.',
    )
    updatedBy: Optional[str] = Field(None, description='User who made the update.')
    href: Optional[basic.Href] = Field(None, description='Link to this table resource.')
    nodeType: Optional[NodeType] = None
    catalogType: Optional[CatalogType] = None
    materializationType: Optional[MaterializationType] = None
    columns: List[table.Column] = Field(..., description='Columns in this table.')
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this table.'
    )
    database: Optional[entityReference.EntityReference] = Field(
        None, description='Reference to Database that contains this table.'
    )
    location: Optional[entityReference.EntityReference] = Field(
        None, description='Reference to the Location that contains this table.'
    )
    viewDefinition: Optional[basic.SqlQuery] = Field(
        None, description='View Definition in SQL. Applies to TableType.View only.'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this table.'
    )
    usageSummary: Optional[usageDetails.TypeUsedToReturnUsageDetailsOfAnEntity] = Field(
        None, description='Latest usage information for this table.'
    )
    followers: Optional[entityReference.EntityReferenceList] = Field(
        None, description='Followers of this table.'
    )
    changeDescription: Optional[entityHistory.ChangeDescription] = Field(
        None, description='Change that lead to this version of the entity.'
    )
