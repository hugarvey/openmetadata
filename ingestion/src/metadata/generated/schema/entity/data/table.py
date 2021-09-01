# generated by datamodel-codegen:
#   filename:  schema/entity/data/table.json
#   timestamp: 2021-08-28T03:07:16+00:00

from __future__ import annotations

from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, Extra, Field, constr

from ...type import basic, entityReference, tagLabel, usageDetails


class TableType(Enum):
    Regular = 'Regular'
    External = 'External'
    View = 'View'
    SecureView = 'SecureView'
    MaterializedView = 'MaterializedView'


class ColumnDataType(Enum):
    NUMBER = 'NUMBER'
    TINYINT = 'TINYINT'
    SMALLINT = 'SMALLINT'
    INT = 'INT'
    BIGINT = 'BIGINT'
    FLOAT = 'FLOAT'
    DOUBLE = 'DOUBLE'
    DECIMAL = 'DECIMAL'
    NUMERIC = 'NUMERIC'
    TIMESTAMP = 'TIMESTAMP'
    TIME = 'TIME'
    DATE = 'DATE'
    DATETIME = 'DATETIME'
    INTERVAL = 'INTERVAL'
    STRING = 'STRING'
    MEDIUMTEXT = 'MEDIUMTEXT'
    TEXT = 'TEXT'
    CHAR = 'CHAR'
    VARCHAR = 'VARCHAR'
    BOOLEAN = 'BOOLEAN'
    BINARY = 'BINARY'
    VARBINARY = 'VARBINARY'
    ARRAY = 'ARRAY'
    BLOB = 'BLOB'
    LONGBLOB = 'LONGBLOB'
    MEDIUMBLOB = 'MEDIUMBLOB'
    MAP = 'MAP'
    STRUCT = 'STRUCT'
    UNION = 'UNION'
    SET = 'SET'
    GEOGRAPHY = 'GEOGRAPHY'
    ENUM = 'ENUM'
    JSON = 'JSON'


class ColumnConstraint(Enum):
    NULL = 'NULL'
    NOT_NULL = 'NOT_NULL'
    UNIQUE = 'UNIQUE'
    PRIMARY_KEY = 'PRIMARY_KEY'


class ConstraintType(Enum):
    UNIQUE = 'UNIQUE'
    PRIMARY_KEY = 'PRIMARY_KEY'
    FOREIGN_KEY = 'FOREIGN_KEY'


class TableConstraint(BaseModel):
    constraintType: Optional[ConstraintType] = None
    columns: Optional[List[str]] = Field(
        None, description='List of column names corresponding to the constraint.'
    )


class ColumnName(BaseModel):
    __root__: constr(regex=r'^[^.]*$', min_length=1, max_length=64) = Field(
        ..., description='Local name (not fully qualified name) of the column.'
    )


class TableName(BaseModel):
    __root__: constr(regex=r'^[^.]*$', min_length=1, max_length=64) = Field(
        ..., description='Local name (not fully qualified name) of a table.'
    )


class FullyQualifiedColumnName(BaseModel):
    __root__: constr(min_length=1, max_length=256) = Field(
        ...,
        description='Fully qualified name of the column that includes `serviceName.databaseName.tableName.columnName`.',
    )


class JoinedWithItem(BaseModel):
    fullyQualifiedName: Optional[FullyQualifiedColumnName] = None
    joinCount: Optional[int] = None


class ColumnJoins(BaseModel):
    class Config:
        extra = Extra.forbid

    columnName: Optional[ColumnName] = None
    joinedWith: Optional[List[JoinedWithItem]] = Field(
        None,
        description='Fully qualified names of the columns that this column is joined with.',
    )


class TableData(BaseModel):
    class Config:
        extra = Extra.forbid

    columns: Optional[List[ColumnName]] = Field(
        None,
        description='List of local column names (not fully qualified column names) of the table.',
    )
    rows: Optional[List[List[Union[str, float]]]] = Field(
        None, description='Data for multiple rows of the table.'
    )


class TableJoins(BaseModel):
    class Config:
        extra = Extra.forbid

    startDate: Optional[basic.Date] = Field(
        None, description='Date can be only from today going back to last 29 days.'
    )
    dayCount: Optional[int] = 1
    columnJoins: Optional[List[ColumnJoins]] = None


class Column(BaseModel):
    name: ColumnName
    columnDataType: ColumnDataType = Field(
        ..., description='Data type of the column (int, date etc.).'
    )
    description: Optional[str] = Field(None, description='Description of the column.')
    fullyQualifiedName: Optional[FullyQualifiedColumnName] = None
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags associated with the column.'
    )
    columnConstraint: Optional[ColumnConstraint] = Field(
        None, description='Column level constraint.'
    )
    ordinalPosition: Optional[int] = Field(
        None, description='Ordinal position of the column.'
    )


class Table(BaseModel):
    id: basic.Uuid = Field(..., description='Unique identifier of this table instance.')
    name: TableName = Field(
        ..., description='Name of a table. Expected to be unique within a database.'
    )
    description: Optional[str] = Field(None, description='Description of a table.')
    href: Optional[basic.Href] = Field(None, description='Link to this table resource.')
    tableType: Optional[TableType] = None
    fullyQualifiedName: Optional[str] = Field(
        None,
        description='Fully qualified name of a table in the form `serviceName.databaseName.tableName`.',
    )
    columns: List[Column] = Field(..., description='Columns in this table.')
    tableConstraints: Optional[List[TableConstraint]] = Field(
        None, description='Table constraints.'
    )
    usageSummary: Optional[usageDetails.TypeUsedToReturnUsageDetailsOfAnEntity] = Field(
        None, description='Latest usage information for this table.'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this table.'
    )
    followers: Optional[entityReference.EntityReferenceList] = Field(
        None, description='Followers of this table.'
    )
    database: Optional[entityReference.EntityReference] = Field(
        None, description='Reference to Database that contains this table.'
    )
    viewDefinition: Optional[basic.SqlQuery] = Field(
        None, description='View Definition in SQL. Applies to TableType.View only.'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this table.'
    )
    joins: Optional[TableJoins] = Field(
        None,
        description='Details of other tables this table is frequently joined with.',
    )
    sampleData: Optional[TableData] = Field(
        None, description='Sample data for a table.'
    )
