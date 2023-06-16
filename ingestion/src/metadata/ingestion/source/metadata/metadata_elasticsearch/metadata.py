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
"""Metadata ES source module"""

from time import sleep

from metadata.generated.schema.api.createEventPublisherJob import (
    CreateEventPublisherJob,
)
from metadata.generated.schema.entity.services.connections.metadata.metadataESConnection import (
    MetadataESConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.system.eventPublisherJob import (
    PublisherType,
    RunMode,
    Status,
)
from metadata.ingestion.api.common import Entity
from metadata.ingestion.api.source import InvalidSourceException, Source
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class MetadataElasticsearchSource(Source[Entity]):
    """
    Metadata Elasticsearch Source
    Used for metadata to ES pipeline
    """

    config: WorkflowSource

    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):
        super().__init__()
        self.config = config
        self.metadata_config = metadata_config
        self.metadata = OpenMetadata(metadata_config)
        self.service_connection: MetadataESConnection = (
            config.serviceConnection.__root__.config
        )
        self.source_config = self.config.sourceConfig.config

    def prepare(self):
        pass

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: MetadataESConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, MetadataESConnection):
            raise InvalidSourceException(
                f"Expected MetadataESConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def next_record(self) -> None:
        yield CreateEventPublisherJob(
            name=self.config.serviceName,
            publisherType=PublisherType.elasticSearch,
            runMode=RunMode.batch,
            batchSize=self.source_config.batchSize,
            searchIndexMappingLanguage=self.source_config.searchIndexMappingLanguage,
            entities=self.service_connection.entities,
            recreateIndex=self.source_config.recreateIndex,
        )

        self.log_reindex_status()

    def log_reindex_status(self) -> None:
        """
        Method to log re-indexing job status.
        """
        status = None
        total_retries_count = 3
        current_try = 1

        while status not in {Status.COMPLETED, Status.FAILED, Status.STOPPED}:
            sleep(5)
            job = self.metadata.get_latest_reindex_job()
            if job and job.stats and job.stats.jobStats:
                logger.info(
                    f"Processed {job.stats.jobStats.processedRecords} records,"
                    f"{job.stats.jobStats.successRecords} succeeded"
                    f"and {job.stats.jobStats.failedRecords} failed."
                )
                status = job.status
                current_try = 1
            else:
                logger.warning("Failed to fetch job stats")
                current_try += 1

            if current_try >= total_retries_count:
                break

        if job.failure and job.failure.jobError:
            logger.warning(f"Failure Context: {job.failure.jobError.context}")
            logger.warning(f"Last Error: {job.failure.jobError.lastFailedReason}")

    def close(self):
        self.metadata.close()

    def test_connection(self) -> None:
        pass
