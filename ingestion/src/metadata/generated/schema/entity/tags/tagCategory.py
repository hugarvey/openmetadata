# generated by datamodel-codegen:
#   filename:  schema/entity/tags/tagCategory.json
#   timestamp: 2021-11-16T07:44:38+00:00

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Extra, Field, constr

from ...type import basic, entityHistory


class TagName(BaseModel):
    __root__: constr(min_length=2, max_length=25) = Field(
        ..., description='Name of the tag.'
    )


class TagCategoryType(Enum):
    Descriptive = 'Descriptive'
    Classification = 'Classification'


class Tag(BaseModel):
    class Config:
        extra = Extra.forbid

    name: TagName = Field(..., description='Name of the tag.')
    fullyQualifiedName: Optional[str] = Field(
        None,
        description='Unique name of the tag of format Category.PrimaryTag.SecondaryTag.',
    )
    description: str = Field(..., description='Unique name of the tag category.')
    version: Optional[entityHistory.EntityVersion] = Field(
        None, description='Metadata version of the entity.'
    )
    updatedAt: Optional[basic.DateTime] = Field(
        None,
        description='Last update time corresponding to the new version of the entity.',
    )
    updatedBy: Optional[str] = Field(None, description='User who made the update.')
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to the tag.'
    )
    usageCount: Optional[int] = Field(
        None, description='Count of how many times this tag and children tags are used.'
    )
    deprecated: Optional[bool] = Field(False, description='If the tag is deprecated.')
    associatedTags: Optional[List[str]] = Field(
        None,
        description="Fully qualified names of tags associated with this tag. Associated tags captures relationship of one tag to another automatically. As an example a tag 'User.PhoneNumber' might have an associated tag 'PII.Sensitive'. When 'User.Address' is used to label a column in a table, 'PII.Sensitive' label is also applied automatically due to Associated tag relationship.",
    )
    children: Optional[List[Tag]] = Field(
        None,
        description='Tags under this tag group or empty for tags at the leaf level.',
    )


class TagCategory(BaseModel):
    class Config:
        extra = Extra.forbid

    name: TagName
    displayName: Optional[str] = Field(
        None, description='Display Name that identifies this tag category.'
    )
    description: str = Field(..., description='Description of the tag category.')
    version: Optional[entityHistory.EntityVersion] = Field(
        None, description='Metadata version of the entity.'
    )
    updatedAt: Optional[basic.DateTime] = Field(
        None,
        description='Last update time corresponding to the new version of the entity.',
    )
    updatedBy: Optional[str] = Field(None, description='User who made the update.')
    categoryType: TagCategoryType
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to the tag category.'
    )
    usageCount: Optional[int] = Field(
        None,
        description='Count of how many times the tags from this tag category are used.',
    )
    children: Optional[List[Tag]] = Field(None, description='Tags under this category.')
    changeDescription: Optional[entityHistory.ChangeDescription] = Field(
        None, description='Change that lead to this version of the entity.'
    )


Tag.update_forward_refs()
