# generated by datamodel-codegen:
#   filename:  schema/type/entityLineage.json
#   timestamp: 2021-10-21T09:57:03+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Extra, Field

from . import basic, entityReference


class Edge(BaseModel):
    fromEntity: Optional[basic.Uuid] = Field(
        None, description='From entity that is upstream of lineage edge.'
    )
    toEntity: Optional[basic.Uuid] = Field(
        None, description='To entity that is downstream of lineage edge.'
    )
    description: Optional[str] = None


class EntityLineage(BaseModel):
    class Config:
        extra = Extra.forbid

    entity: entityReference.EntityReference = Field(
        ..., description='Primary entity for which this lineage graph is created.'
    )
    nodes: Optional[List[entityReference.EntityReference]] = None
    upstreamEdges: Optional[List[Edge]] = None
    downstreamEdges: Optional[List[Edge]] = None


class EntitiesEdge(BaseModel):
    fromEntity: Optional[entityReference.EntityReference] = Field(
        None, description='From entity that is upstream of lineage edge.'
    )
    toEntity: Optional[entityReference.EntityReference] = Field(
        None, description='To entity that is downstream of lineage edge.'
    )
    description: Optional[str] = None
