# generated by datamodel-codegen:
#   filename:  schema/api/data/createTopic.json
#   timestamp: 2021-10-12T00:34:28+00:00

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field, conint

from ...entity.data import topic
from ...type import entityReference, tagLabel


class CreateTopic(BaseModel):
    name: topic.TopicName = Field(
        ..., description='Name that identifies this topic instance uniquely.'
    )
    description: Optional[str] = Field(
        None,
        description='Description of the topic instance. What it has and how to use it.',
    )
    service: entityReference.EntityReference = Field(
        ..., description='Link to the messaging service where this topic is hosted in'
    )
    partitions: conint(ge=1) = Field(
        ..., description='Number of partitions into which the topic is divided.'
    )
    schemaText: Optional[str] = Field(
        None,
        description='Schema used for message serialization. Optional as some topics may not have associated schemas.',
    )
    schemaType: Optional[topic.SchemaType] = Field(
        None, description='Schema used for message serialization.'
    )
    cleanupPolicies: Optional[List[topic.CleanupPolicy]] = Field(
        None,
        description='Topic clean up policy. For Kafka - `cleanup.policy` configuration.',
    )
    replicationFactor: Optional[int] = Field(
        None, description='Replication Factor in integer (more than 1).'
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
        None, description='Owner of this topic'
    )
    tags: Optional[List[tagLabel.TagLabel]] = Field(
        None, description='Tags for this topic'
    )
