# generated by datamodel-codegen:
#   filename:  schema/api/services/createDashboardService.json
#   timestamp: 2021-10-21T09:57:03+00:00

from __future__ import annotations

from typing import Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...entity.services import dashboardService
from ...type import schedule


class CreateDashboardServiceEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies the this entity instance uniquely'
    )
    description: Optional[str] = Field(
        None, description='Description of dashboard service entity.'
    )
    serviceType: dashboardService.DashboardServiceType
    dashboardUrl: AnyUrl = Field(..., description='Dashboard Service URL')
    username: Optional[str] = Field(
        None, description='Username to log-into Dashboard Service'
    )
    password: Optional[str] = Field(
        None, description='Password to log-into Dashboard Service'
    )
    ingestionSchedule: Optional[schedule.Schedule] = Field(
        None, description='Schedule for running metadata ingestion jobs'
    )
