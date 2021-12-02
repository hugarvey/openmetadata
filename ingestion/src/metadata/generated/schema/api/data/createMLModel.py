# generated by datamodel-codegen:
#   filename:  schema/api/data/createMLModel.json
#   timestamp: 2021-12-02T03:29:40+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, constr

from ...entity.data import mlmodel
from ...type import entityReference, tagLabel


class CreateMLModelEntityRequest(BaseModel):
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies this ML model.'
    )
    displayName: Optional[str] = Field(
        None,
        description='Display Name that identifies this ML model. It could be title or label from the source services',
    )
    description: Optional[str] = Field(
        None,
        description='Description of the ML model instance. How it was trained and for what it is used.',
    )
    algorithm: str = Field(..., description='Algorithm used to train the ML model')
    mlFeatures: Optional[List[mlmodel.MlFeature]] = Field(
        None, description='Features used to train the ML Model.'
    )
    mlHyperParameters: Optional[List[mlmodel.MlHyperParameter]] = Field(
        None, description='Hyper Parameters used to train the ML Model.'
    )
    dashboard: Optional[entityReference.EntityReference] = Field(
        None, description='Performance Dashboard URL to track metric evolution'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this ML Model'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this database'
    )
