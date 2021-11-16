# generated by datamodel-codegen:
#   filename:  schema/type/changeEvent.json
#   timestamp: 2021-11-16T07:44:38+00:00

from __future__ import annotations

from enum import Enum
from typing import Any, List, Optional

from pydantic import BaseModel, Extra, Field

from . import basic, entityHistory


class EventType(Enum):
    entityCreated = 'entityCreated'
    entityUpdated = 'entityUpdated'
    entityDeleted = 'entityDeleted'


class EventFilter(BaseModel):
    eventType: EventType = Field(..., description='Event type that is being requested.')
    entities: Optional[List[str]] = Field(
        None,
        description='Entities for which the events are needed. Example - `table`, `topic`, etc. **When not set, events for all the entities will be provided**.',
    )


class ChangeEvent(BaseModel):
    class Config:
        extra = Extra.forbid

    eventType: EventType
    entityType: str = Field(
        ...,
        description='Entity type that changed. Use the schema of this entity to process the entity attribute.',
    )
    entityId: basic.Uuid = Field(
        ..., description='Identifier of entity that was modified by the operation.'
    )
    previousVersion: Optional[entityHistory.EntityVersion] = Field(
        None,
        description='Version of the entity before this change. Note that not all changes result in entity version change. When entity version is not changed, `previousVersion` is same as `currentVersion`.',
    )
    currentVersion: Optional[entityHistory.EntityVersion] = Field(
        None,
        description='Current version of the entity after this change. Note that not all changes result in entity version change. When entity version is not changed, `previousVersion` is same as `currentVersion`.',
    )
    userName: Optional[str] = Field(
        None, description='Name of the user whose activity resulted in the change.'
    )
    dateTime: basic.DateTime = Field(
        ..., description='Date and time when the change was made.'
    )
    changeDescription: Optional[entityHistory.ChangeDescription] = Field(
        None,
        description='For `eventType` `entityUpdated` this field captures details about what fields were added/updated/deleted. For `eventType` `entityCreated` or `entityDeleted` this field is null.',
    )
    entity: Optional[Any] = Field(
        None,
        description='For `eventType` `entityCreated`, this field captures JSON coded string of the entity using the schema corresponding to `entityType`.',
    )
