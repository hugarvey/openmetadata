# generated by datamodel-codegen:
#   filename:  schema/entity/policies/lifecycle/deleteAction.json
#   timestamp: 2021-11-20T15:09:34+00:00

from __future__ import annotations

from typing import Any, Optional, Union

from pydantic import BaseModel, Field, conint


class LifecycleDeleteAction1(BaseModel):
    daysAfterCreation: Optional[conint(ge=1)] = Field(
        None,
        description='Number of days after creation of the entity that the deletion should be triggered.',
    )
    daysAfterModification: Optional[conint(ge=1)] = Field(
        None,
        description='Number of days after last modification of the entity that the deletion should be triggered.',
    )


class LifecycleDeleteAction(BaseModel):
    __root__: Union[LifecycleDeleteAction1, Any, Any] = Field(
        ...,
        description='An action to delete or expire the entity.',
        title='LifecycleDeleteAction',
    )
