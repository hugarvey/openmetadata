# generated by datamodel-codegen:
#   filename:  data/tags/piiTags.json
#   timestamp: 2021-08-17T03:53:57+00:00

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class Model(BaseModel):
    __root__: Any = Field(
        ...,
        description='Personally Identifiable Information information that, when used alone or with other relevant data, can identify an individual.\n\n\n\n_Note to Legal_\n\n_This tag category is provided as a starting point. Please review and update the tags based on your company policy. Also, add a reference to your PII policy document in this description._',
    )
