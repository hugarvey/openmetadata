# generated by datamodel-codegen:
#   filename:  schema/entity/feed/thread.json
#   timestamp: 2021-09-01T06:44:13+00:00

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from ...type import basic


class Post(BaseModel):
    message: str = Field(
        ...,
        description='Message in markdown format. See markdown support for more details.',
    )
    postTs: Optional[datetime] = Field(None, description='Timestamp of the post.')
    from_: basic.Uuid = Field(
        ...,
        alias='from',
        description='ID of User (regular user or a bot) posting the message.',
    )


class Thread(BaseModel):
    id: basic.Uuid = Field(
        ..., description='Unique identifier that identifies an entity instance.'
    )
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to this entity.'
    )
    threadTs: Optional[basic.DateTime] = Field(
        None, description='Timestamp of the when the first post created the thread.'
    )
    about: basic.EntityLink = Field(
        ...,
        description='Data asset about which this thread is created for with format <#E/{enties}/{entityName}/{field}/{fieldValue}.',
    )
    addressedTo: Optional[basic.EntityLink] = Field(
        None,
        description='User or team this thread is addressed to in format <#E/{enties}/{entityName}/{field}/{fieldValue}.',
    )
    posts: List[Post]
