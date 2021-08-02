#  Licensed to the Apache Software Foundation (ASF) under one or more
#  contributor license agreements. See the NOTICE file distributed with
#  this work for additional information regarding copyright ownership.
#  The ASF licenses this file to You under the Apache License, Version 2.0
#  (the "License"); you may not use this file except in compliance with
#  the License. You may obtain a copy of the License at
#
#  http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# generated by datamodel-codegen:
#   filename:  schema/entity/tags/tagCategory.json
#   timestamp: 2021-07-31T17:12:10+00:00

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, constr

from type import basic


class TagName(BaseModel):
    __root__: constr(min_length=2, max_length=25) = Field(
        ..., description='Name of the tag'
    )


class TagCategoryType(Enum):
    Descriptive = 'Descriptive'
    Classification = 'Classification'


class Tag(BaseModel):
    name: TagName
    fullyQualifiedName: Optional[str] = Field(
        None,
        description='Unique name of the tag of format Category.PrimaryTag.SecondaryTag',
    )
    description: str = Field(..., description='Unique name of the tag category')
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to the tag'
    )
    usageCount: Optional[int] = Field(
        None, description='Count of how many times this tag and children tags are used'
    )
    deprecated: Optional[bool] = Field(False, description='If the tag is deprecated')
    associatedTags: Optional[List[str]] = Field(
        None, description='Fully qualified names of tags associated with this tag'
    )
    children: Optional[List[Tag]] = Field(
        None, description='Tags under this tag group or empty for tags at leaf level'
    )


class TypesRelatedToTagCategory(BaseModel):
    name: TagName
    description: str = Field(..., description='Description of the tag category')
    categoryType: TagCategoryType
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to the tag category'
    )
    usageCount: Optional[int] = Field(
        None,
        description='Count of how many times the tags from this tag category are used',
    )
    children: Optional[List[Tag]] = Field(None, description='Tags under this category')


Tag.update_forward_refs()
