#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""
Custom wrapper for Tag and Classification
"""
from typing import Optional

from pydantic import BaseModel

from metadata.generated.schema.api.classification.createTag import CreateTagRequest
from metadata.generated.schema.api.classification.createClassification import (
    CreateClassificationRequest,
)
from metadata.generated.schema.type.basic import FullyQualifiedEntityName


class OMetaTagAndClassification(BaseModel):
    fqn: Optional[FullyQualifiedEntityName]
    classification_name: CreateClassificationRequest
    classification_details: CreateTagRequest
