# generated by datamodel-codegen:
#   filename:  schema/api/feed/createThread.json
#   timestamp: 2021-09-09T17:49:00+00:00

from __future__ import annotations

from pydantic import BaseModel, Field

from ...type import basic


class CreateThreadRequest(BaseModel):
    message: str = Field(..., description='Message')
    from_: basic.Uuid = Field(
        ...,
        alias='from',
        description='ID of User (regular user or bot) posting the message',
    )
    about: basic.EntityLink = Field(
        ...,
        description='Data asset about which this thread is created for with format <#E/{enties}/{entityName}/{field}/{fieldValue}',
    )
