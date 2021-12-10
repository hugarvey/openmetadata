# generated by datamodel-codegen:
#   filename:  schema/entity/services/dashboardService.json
#   timestamp: 2021-12-10T11:30:44+00:00

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import AnyUrl, BaseModel, Field, constr

from ...type import basic, entityHistory, schedule


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
    displayName: Optional[str] = Field(
        None, description='Display Name that identifies this dashboard service.'
    )
    serviceType: DashboardServiceType = Field(
        ..., description='Type of dashboard service such as Looker or Superset...'
    )
    description: Optional[str] = Field(
        None, description='Description of a dashboard service instance.'
    )
    version: Optional[entityHistory.EntityVersion] = Field(
        None, description='Metadata version of the entity.'
    )
    updatedAt: Optional[basic.DateTime] = Field(
        None,
        description='Last update time corresponding to the new version of the entity.',
    )
    updatedBy: Optional[str] = Field(None, description='User who made the update.')
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
    changeDescription: Optional[entityHistory.ChangeDescription] = Field(
        None, description='Change that lead to this version of the entity.'
    )
