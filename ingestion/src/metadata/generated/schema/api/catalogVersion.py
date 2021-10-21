# generated by datamodel-codegen:
#   filename:  schema/api/catalogVersion.json
#   timestamp: 2021-10-21T09:57:03+00:00

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from ..type import basic


class CatalogApplicationSoftwareVersion(BaseModel):
    version: Optional[str] = Field(None, description='Software version of the catalog')
    revision: Optional[str] = Field(
        None, description='Software revision of the catalog'
    )
    timestamp: Optional[basic.Timestamp] = Field(None, description='Build timestamp')
