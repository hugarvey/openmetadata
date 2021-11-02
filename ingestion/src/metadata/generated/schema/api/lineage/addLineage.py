# generated by datamodel-codegen:
#   filename:  schema/api/lineage/addLineage.json
#   timestamp: 2021-10-31T21:55:34+00:00

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from ...type import entityLineage


class AddLineage(BaseModel):
    description: Optional[str] = Field(
        None, description='User provided description of the lineage details.'
    )
    edge: entityLineage.EntitiesEdge = Field(..., description='Lineage edge details.')
