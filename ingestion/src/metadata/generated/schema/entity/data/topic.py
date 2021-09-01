# generated by datamodel-codegen:
#   filename:  schema/entity/data/topic.json
#   timestamp: 2021-09-01T06:44:13+00:00

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, conint, constr

from ...type import basic, entityReference, tagLabel


class TopicName(BaseModel):
    __root__: constr(regex=r'^[^.]*$', min_length=1, max_length=64) = Field(
        ..., description='Name that identifies a topic.'
    )


class SchemaType(Enum):
    Avro = 'Avro'
    Protobuf = 'Protobuf'
    JSON = 'JSON'
    Other = 'Other'


class CleanupPolicy(Enum):
    delete = 'delete'
    compact = 'compact'


class Topic(BaseModel):
    id: basic.Uuid = Field(
        ..., description='Unique identifier that identifies this topic instance.'
    )
    name: TopicName = Field(..., description='Name that identifies the topic.')
    fullyQualifiedName: Optional[str] = Field(
        None,
        description="Name that uniquely identifies a topic in the format 'messagingServiceName.topicName'.",
    )
    description: Optional[str] = Field(
        None, description='Description of the topic instance.'
    )
    service: entityReference.EntityReference = Field(
        ...,
        description='Link to the messaging cluster/service where this topic is hosted in.',
    )
    partitions: conint(ge=1) = Field(
        ..., description='Number of partitions into which the topic is divided.'
    )
    schemaText: Optional[str] = Field(
        None,
        description='Schema used for message serialization. Optional as some topics may not have associated schemas.',
    )
    schemaType: Optional[SchemaType] = Field(
        None, description='Schema used for message serialization.'
    )
    cleanupPolicies: Optional[List[CleanupPolicy]] = Field(
        None,
        description='Topic clean up policies. For Kafka - `cleanup.policy` configuration.',
    )
    retentionTime: Optional[float] = Field(
        None,
        description='Retention time in milliseconds. For Kafka - `retention.ms` configuration.',
    )
    maximumMessageSize: Optional[int] = Field(
        None,
        description='Maximum message size in bytes. For Kafka - `max.message.bytes` configuration.',
    )
    minimumInSyncReplicas: Optional[int] = Field(
        None,
        description='Minimum number replicas in sync to control durability. For Kafka - `min.insync.replicas` configuration.',
    )
    retentionSize: Optional[float] = Field(
        '-1',
        description='Maximum size of a partition in bytes before old data is discarded. For Kafka - `retention.bytes` configuration.',
    )
    owner: Optional[entityReference.EntityReference] = Field(
        None, description='Owner of this topic.'
    )
    followers: Optional[entityReference.EntityReferenceList] = Field(
        None, description='Followers of this table.'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this table.'
    )
    href: Optional[basic.Href] = Field(
        None, description='Link to the resource corresponding to this entity.'
    )
