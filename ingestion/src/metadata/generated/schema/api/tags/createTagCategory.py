# generated by datamodel-codegen:
#   filename:  schema/api/tags/createTagCategory.json
#   timestamp: 2021-12-04T12:57:16+00:00

from __future__ import annotations

from pydantic import BaseModel, Field

from ...entity.tags import tagCategory


class CreateTagCategoryEntityRequest(BaseModel):
    name: tagCategory.TagName
    description: str = Field(..., description='Description of the tag category')
    categoryType: tagCategory.TagCategoryType
