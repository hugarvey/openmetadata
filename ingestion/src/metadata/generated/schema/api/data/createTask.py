# generated by datamodel-codegen:
#   filename:  schema/api/data/createTask.json
#   timestamp: 2021-10-31T08:53:25+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...type import basic, entityReference, tagLabel


class CreateTaskEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies this Task.'
    )
    displayName: Optional[str] = Field(
        None,
        description='Display Name that identifies this Task. It could be title or label from the pipeline services',
    )
    description: Optional[str] = Field(
        None,
        description='Description of the task instance. What it has and how to use it.',
    )
    taskUrl: Optional[AnyUrl] = Field(
        None,
        description='Task URL to visit/manage. This URL points to respective pipeline service UI',
    )
    taskType: Optional[str] = Field(
        None, description='Type of the Task. Usually refers to the class it implements'
    )
    taskSQL: Optional[str] = Field(
        None, description='SQL used in the task. Can be used to determine the lineage'
    )
    downstreamTasks: Optional[List[constr(min_length=1, max_length=64)]] = Field(
        None, description='All the tasks that are downstream of this task.'
    )
    startDate: Optional[basic.DateTime] = Field(
        None, description='Start date of the task'
    )
    endDate: Optional[basic.DateTime] = Field(None, description='End date of the task')
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this chart'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this Task'
    )
    service: entityReference.EntityReference = Field(
        ..., description='Link to the pipeline service where this task is used'
    )
