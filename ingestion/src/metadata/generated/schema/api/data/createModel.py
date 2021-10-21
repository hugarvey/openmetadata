# generated by datamodel-codegen:
#   filename:  schema/api/data/createModel.json
#   timestamp: 2021-10-21T09:57:03+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, constr

from ...type import entityReference, tagLabel


class CreateModelEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies this model.'
    )
    displayName: Optional[str] = Field(
        None,
        description='Display Name that identifies this model. It could be title or label from the source services',
    )
    description: Optional[str] = Field(
        None,
        description='Description of the model instance. How it was trained and for what it is used.',
    )
    algorithm: str = Field(..., description='Algorithm used to train the model')
    dashboard: Optional[entityReference.EntityReference] = Field(
        None, description='Performance Dashboard URL to track metric evolution'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this model'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this database'
    )
