# generated by datamodel-codegen:
#   filename:  schema/api/lineage/addLineage.json
#   timestamp: 2021-12-02T03:29:40+00:00

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from ...type import entityLineage


class AddLineage(BaseModel):
    description: Optional[str] = Field(
        None, description='User provided description of the lineage details.'
    )
    edge: entityLineage.EntitiesEdge = Field(..., description='Lineage edge details.')
