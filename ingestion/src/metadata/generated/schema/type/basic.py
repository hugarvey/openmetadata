# generated by datamodel-codegen:
#   filename:  schema/type/basic.json
#   timestamp: 2021-11-16T07:44:38+00:00

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import AnyUrl, BaseModel, EmailStr, Field, constr


class Basic(BaseModel):
    __root__: Any = Field(
        ...,
        description='This schema defines basic common types that are used by other schemas.',
        title='Basic',
    )


class Uuid(BaseModel):
    __root__: UUID = Field(..., description='Unique id used to identify an entity.')


class Email(BaseModel):
    __root__: EmailStr = Field(
        ..., description='Email address of a user or other entities.'
    )


class Timestamp(BaseModel):
    __root__: str = Field(..., description='Timestamp in unixTimeMillis.')


class Href(BaseModel):
    __root__: AnyUrl = Field(..., description='URI that points to a resource.')


class TimeInterval(BaseModel):
    start: Optional[int] = Field(None, description='Start time in unixTimeMillis.')
    end: Optional[int] = Field(None, description='End time in unixTimeMillis.')


class Duration(BaseModel):
    __root__: str = Field(
        ..., description="Duration in ISO 8601 format in UTC. Example - 'P23DT23H'."
    )


class Date(BaseModel):
    __root__: date = Field(
        ..., description="Date in ISO 8601 format in UTC. Example - '2018-11-13'."
    )


class DateTime(BaseModel):
    __root__: datetime = Field(
        ...,
        description="Date and time in ISO 8601 format. Example - '2018-11-13T20:20:39+00:00'.",
    )


class EntityLink(BaseModel):
    __root__: constr(regex=r'^<#E/\S+/\S+>$') = Field(
        ...,
        description='Link to an entity or field within an entity using this format `<#E/{enties}/{entityName}/{field}/{fieldValue}`.',
    )


class SqlQuery(BaseModel):
    __root__: str = Field(
        ..., description="SQL query statement. Example - 'select * from orders'."
    )
