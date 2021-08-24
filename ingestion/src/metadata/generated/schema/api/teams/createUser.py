# generated by datamodel-codegen:
#   filename:  schema/api/teams/createUser.json
#   timestamp: 2021-08-23T15:40:00+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field

from ...entity.teams import user
from ...type import basic, profile


class RequestToCreateUserEntity(BaseModel):
    name: user.UserName
    displayName: Optional[str] = Field(
        None, description="Name used for display purposes. Example 'FirstName LastName'"
    )
    email: basic.Email
    timezone: Optional[str] = Field(None, description='Timezone of the user')
    isBot: Optional[bool] = Field(
        None,
        description='When true indicates user is a bot with appropriate privileges',
    )
    isAdmin: Optional[bool] = Field(
        False,
        description='When true indicates user is an adiministrator for the sytem with superuser privileges',
    )
    profile: Optional[profile.Profile] = None
    teams: Optional[List[basic.Uuid]] = Field(
        None, description='Teams that the user belongs to'
    )
