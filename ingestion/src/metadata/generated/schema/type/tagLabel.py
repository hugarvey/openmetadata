# generated by datamodel-codegen:
#   filename:  schema/type/tagLabel.json
#   timestamp: 2021-09-28T21:56:25+00:00

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Extra, Field, constr

from . import basic


class LabelType(Enum):
    Manual = 'Manual'
    Propagated = 'Propagated'
    Automated = 'Automated'
    Derived = 'Derived'


class State(Enum):
    Suggested = 'Suggested'
    Confirmed = 'Confirmed'


class TagLabel(BaseModel):
    class Config:
        extra = Extra.forbid

    tagFQN: Optional[constr(max_length=45)] = None
    labelType: Optional[LabelType] = Field(
        'Manual',
        description="Label type describes how a tag label was applied. 'Manual' indicates the tag label was applied by a person. 'Derived' indicates a tag label was derived using the associated tag relationship (see TagCategory.json for more details). 'Propagated` indicates a tag label was propagated from upstream based on lineage. 'Automated' is used when a tool was used to determine the tag label.",
    )
    state: Optional[State] = Field(
        'Confirmed',
        description="'Suggested' state is used when a tag label is suggested by users or tools. Owner of the entity must confirm the suggested labels before it is marked as 'Confirmed'.",
    )
    href: Optional[basic.Href] = Field(None, description='Link to the tag resource.')
