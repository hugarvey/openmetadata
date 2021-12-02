# generated by datamodel-codegen:
#   filename:  schema/entity/policies/filters.json
#   timestamp: 2021-12-02T02:38:07+00:00

from __future__ import annotations

from typing import Any, List, Union

from pydantic import BaseModel, Field

from ...type import tagLabel


class Filters(BaseModel):
    __root__: Any = Field(..., title='Filters')


class Filters1(BaseModel):
    __root__: List[Union[str, tagLabel.TagLabel]] = Field(
        ...,
        description='The set of filters that are used to match on entities. A logical AND operation is applied across all filters.',
        min_length=1,
    )
