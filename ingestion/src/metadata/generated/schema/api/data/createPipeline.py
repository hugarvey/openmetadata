# generated by datamodel-codegen:
#   filename:  schema/api/data/createPipeline.json
#   timestamp: 2021-10-31T21:55:34+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...entity.data import pipeline
from ...type import basic, entityReference, tagLabel


class CreatePipelineEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies this pipeline instance uniquely.'
    )
    displayName: Optional[str] = Field(
        None,
        description='Display Name that identifies this Pipeline. It could be title or label from the source services.',
    )
    description: Optional[str] = Field(
        None,
        description='Description of the database instance. What it has and how to use it.',
    )
    pipelineUrl: Optional[AnyUrl] = Field(
        None,
        description='Pipeline  URL to visit/manage. This URL points to respective pipeline service UI',
    )
    concurrency: Optional[int] = Field(None, description='Concurrency of the Pipeline')
    pipelineLocation: Optional[str] = Field(None, description='Pipeline Code Location')
    startDate: Optional[basic.DateTime] = Field(
        None, description='Start date of the workflow'
    )
    tasks: Optional[List[pipeline.Task]] = Field(
        None, description='All the tasks that are part of pipeline.'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this Pipeline.'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this database'
    )
    service: entityReference.EntityReference = Field(
        ..., description='Link to the database service where this database is hosted in'
    )
