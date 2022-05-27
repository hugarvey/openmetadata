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

import collections

# This import verifies that the dependencies are available.
import logging as log
import os
from datetime import datetime
from typing import Any, Dict, Iterable, Optional

from google.cloud import logging

from metadata.generated.schema.entity.services.connections.database.bigQueryConnection import (
    BigQueryConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.entity.services.databaseService import (
    DatabaseServiceType,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.utils.credentials import set_google_credentials
from metadata.utils.helpers import get_start_and_end

logger = log.getLogger(__name__)


class BigqueryUsageSource:
    SERVICE_TYPE = DatabaseServiceType.BigQuery.value
    scheme = "bigquery"

    def __init__(self, config: WorkflowSource, metadata_config: OpenMetadataConnection):
        super().__init__()
        self.temp_credentials = None
        self.metadata_config = metadata_config
        self.config = config
        self.service_connection = config.serviceConnection.__root__.config

        # Used as db
        self.project_id = (
            self.service_connection.projectId
            or self.service_connection.credentials.gcsConfig.projectId
        )

        self.logger_name = "cloudaudit.googleapis.com%2Fdata_access"
        self.logging_client = logging.Client()
        self.usage_logger = self.logging_client.logger(self.logger_name)
        logger.debug("Listing entries for logger {}:".format(self.usage_logger.name))
        self.start, self.end = get_start_and_end(
            self.config.sourceConfig.config.queryLogDuration
        )

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: BigQueryConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, BigQueryConnection):
            raise InvalidSourceException(
                f"Expected BigQueryConnection, but got {connection}"
            )

        set_google_credentials(
            gcs_credentials=config.serviceConnection.__root__.config.credentials
        )

        return cls(config, metadata_config)

    def _get_raw_extract_iter(self) -> Optional[Iterable[Dict[str, Any]]]:
        entries = self.usage_logger.list_entries()
        for entry in entries:
            timestamp = entry.timestamp.isoformat()
            timestamp = datetime.strptime(timestamp[0:10], "%Y-%m-%d")

            if (
                timestamp <= self.start
                and timestamp >= self.end
                and "query" not in str(entry.payload)
                and type(entry.payload) != collections.OrderedDict
            ):
                continue

            payload = list(entry.payload.items())[-1][1]
            if ("jobChange" in payload) and (
                "queryConfig" in payload["jobChange"]["job"]["jobConfig"]
            ):
                logger.debug(f"\nEntries: {payload}")
                queryConfig = payload["jobChange"]["job"]["jobConfig"]["queryConfig"]
                jobStats = payload["jobChange"]["job"]["jobStats"]
                self.analysis_date = str(
                    datetime.strptime(
                        jobStats["startTime"][0:19], "%Y-%m-%dT%H:%M:%S"
                    ).strftime("%Y-%m-%d %H:%M:%S")
                )
                yield {
                    "query_text": queryConfig["query"],
                    "user_name": entry.resource.labels["project_id"],
                    "start_time": str(jobStats["startTime"]),
                    "end_time": str(jobStats["endTime"]),
                    "aborted": False,
                    "database_name": self.project_id,
                    "schema_name": None,
                }

    def close(self):
        super().close()
        if self.temp_credentials:
            os.unlink(self.temp_credentials)
