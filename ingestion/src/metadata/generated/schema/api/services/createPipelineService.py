# generated by datamodel-codegen:
#   filename:  schema/api/services/createPipelineService.json
#   timestamp: 2021-10-21T16:10:22+00:00

from __future__ import annotations

from typing import Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...entity.services import pipelineService
from ...type import schedule


class CreatePipelineServiceEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies the this entity instance uniquely'
    )
    description: Optional[str] = Field(
        None, description='Description of pipeline service entity.'
    )
    serviceType: pipelineService.PipelineServiceType
    pipelineUrl: AnyUrl = Field(..., description='Pipeline UI URL')
    ingestionSchedule: Optional[schedule.Schedule] = Field(
        None, description='Schedule for running pipeline ingestion jobs'
    )
