# generated by datamodel-codegen:
#   filename:  schema/entity/services/dashboardService.json
#   timestamp: 2021-10-01T19:50:55+00:00

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...type import basic, schedule


class DashboardServiceType(Enum):
    Superset = 'Superset'
    Looker = 'Looker'
    Tableau = 'Tableau'
    Redash = 'Redash'


class DashboardService(BaseModel):
    id: basic.Uuid = Field(
        ..., description='Unique identifier of this dashboard service instance.'
    )
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies this dashboard service.'
    )
    serviceType: DashboardServiceType = Field(
        ..., description='Type of dashboard service such as Looker or Superset...'
    )
    description: Optional[str] = Field(
        None, description='Description of a dashboard service instance.'
    )
    dashboardUrl: AnyUrl = Field(
        ...,
        description='Dashboard Service URL. This will be used to make REST API calls to Dashboard Service.',
    )
    username: Optional[str] = Field(
        None, description='Username to log-into Dashboard Service.'
    )
    password: Optional[str] = Field(
        None, description='Password to log-into Dashboard Service.'
    )
    ingestionSchedule: Optional[schedule.Schedule] = Field(
        None, description='Schedule for running metadata ingestion jobs.'
    )
    href: Optional[basic.Href] = Field(
        None,
        description='Link to the resource corresponding to this dashboard service.',
    )
