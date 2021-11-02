# generated by datamodel-codegen:
#   filename:  schema/api/data/createDashboard.json
#   timestamp: 2021-10-31T21:55:34+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...type import entityReference, tagLabel


class CreateDashboardEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies this dashboard.'
    )
    displayName: Optional[str] = Field(
        None,
        description='Display Name that identifies this Dashboard. It could be title or label from the source services',
    )
    description: Optional[str] = Field(
        None,
        description='Description of the database instance. What it has and how to use it.',
    )
    dashboardUrl: Optional[AnyUrl] = Field(None, description='Dashboard URL')
    charts: Optional[List[entityReference.EntityReference]] = Field(
        None, description='All the charts included in this Dashboard.'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this chart'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this database'
    )
    service: entityReference.EntityReference = Field(
        ..., description='Link to the database service where this database is hosted in'
    )
