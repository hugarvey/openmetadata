# generated by datamodel-codegen:
#   filename:  schema/type/auditLog.json
#   timestamp: 2021-09-13T04:07:21+00:00

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from . import basic


class Method(Enum):
    POST = 'POST'
    PUT = 'PUT'
    PATCH = 'PATCH'
    DELETE = 'DELETE'


class AuditLog(BaseModel):
    method: Method = Field(..., description='HTTP Method used in a call.')
    responseCode: int = Field(
        ..., description='HTTP response code for the api requested.'
    )
    path: str = Field(..., description='Requested API Path.')
    userName: str = Field(..., description='Name of the user who made the API request.')
    dateTime: Optional[basic.DateTime] = Field(
        None, description='Date when the API call is made.'
    )
    entityId: basic.Uuid = Field(
        ..., description='Identifier of entity that was modified by the operation.'
    )
    entityType: str = Field(
        ..., description='Type of Entity that is modified by the operation.'
    )
