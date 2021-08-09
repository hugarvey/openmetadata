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
#   filename:  schema/entity/data/pipeline.json
#   timestamp: 2021-07-31T17:12:10+00:00

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field, constr

from metadata.generated.schema.type import basic, entityReference


class PipelineEntity(BaseModel):
    id: basic.Uuid = Field(
        ..., description='Unique identifier that identifies a pipeline instance'
    )
    name: constr(min_length=1, max_length=64) = Field(
        ..., description='Name that identifies the this pipeline instance uniquely.'
    )
    fullyQualifiedName: Optional[constr(min_length=1, max_length=64)] = Field(
        None,
        description="Unique name that identifies a pipeline in the format 'ServiceName.PipelineName'",
    )
    description: Optional[str] = Field(
        None, description='Description of this pipeline.'
    )
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to this entity'
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this pipeline'
    )
    service: entityReference.EntityReference = Field(
        ..., description='Link to service where this pipeline is hosted in'
    )
