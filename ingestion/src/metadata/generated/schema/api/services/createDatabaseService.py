# generated by datamodel-codegen:
#   filename:  schema/api/services/createDatabaseService.json
#   timestamp: 2021-08-17T03:53:57+00:00

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, constr

from ...entity.services import databaseService
from ...type import jdbcConnection, schedule


class CreateDatabaseServiceEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies the this entity instance uniquely'
    )
    description: Optional[str] = Field(
        None, description='Description of Database entity.'
    )
    serviceType: databaseService.DatabaseServiceType
    jdbc: jdbcConnection.JdbcInfo
    ingestionSchedule: Optional[
        schedule.TypeUsedForScheduleWithStartTimeAndRepeatFrequency
    ] = Field(None, description='Schedule for running metadata ingestion jobs')
