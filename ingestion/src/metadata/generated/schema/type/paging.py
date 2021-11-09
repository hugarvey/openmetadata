# generated by datamodel-codegen:
#   filename:  schema/type/paging.json
#   timestamp: 2021-11-09T16:16:34+00:00

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class Paging(BaseModel):
    before: Optional[str] = Field(
        None,
        description='Before cursor used for getting the previous page (see API pagination for details).',
    )
    after: Optional[str] = Field(
        None,
        description='After cursor used for getting the next page (see API pagination for details).',
    )
    total: int = Field(
        ..., description='Total number of entries available to page through.'
    )
