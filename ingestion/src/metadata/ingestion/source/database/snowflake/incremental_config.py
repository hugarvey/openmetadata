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
Snowflake incremental config module
"""
import traceback
from typing import List, Optional, Tuple
from datetime import datetime, timedelta

from pydantic import BaseModel

from metadata.generated.schema.entity.services.ingestionPipelines.ingestionPipeline import (
    PipelineState,
    PipelineStatus,
)
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.utils.logger import ingestion_logger


logger = ingestion_logger()


class IncrementalConfig(BaseModel):
    """ Holds the Configuration to extract the Metadata incrementally, if enabled."""
    enabled: bool
    start_timestamp: Optional[int] = None

    @classmethod
    def create(
        cls,
        incremental: Optional[bool],
        pipeline_name: Optional[str],
        metadata: OpenMetadata,
    ) -> "IncrementalConfig":
        """ Returns the IncrementalConfig based on the flow defined on the INcrementalConfigCreator. """
        return IncrementalConfigCreator(incremental, pipeline_name, metadata).create()


class IncrementalConfigCreator:
    """ Helper class to create an IncrementalConfig instance automagically. """
    def __init__(
        self,
        incremental: Optional[bool],
        pipeline_name: Optional[str],
        metadata: OpenMetadata,
        pipeline_status_look_behind_days: int = 7,
        safety_margin_days: int = 7
    ):
        self.incremental = incremental
        self.pipeline_name = pipeline_name
        self.metadata = metadata

        self.pipeline_status_look_behind_days = pipeline_status_look_behind_days
        self.safety_margin_days = safety_margin_days

    def _calculate_pipeline_status_parameters(self) -> Tuple[int, int]:
        """ Calculate the needed 'start' and 'end' parameters based on the 'pipeline_status_look_behind_days'. """
        now = datetime.now()

        # We multiply the value by 1000 because our backend uses epoch_milliseconds instead of epoch_seconds.
        start = int((now - timedelta(days=self.pipeline_status_look_behind_days)).timestamp() * 1000)
        end = int(now.timestamp() * 1000)

        return start, end

    def _get_pipeline_statuses(self) -> Optional[List[PipelineStatus]]:
        """ Retrieve all the pipeline statuses between 'start' and 'end'. """
        if not self.pipeline_name:
            return None

        start, end = self._calculate_pipeline_status_parameters()

        return self.metadata.get_pipeline_status_between_ts(self.pipeline_name, start, end)

    def _get_last_success_timestamp(self, pipeline_statuses: List[PipelineStatus]) -> Optional[int]:
        """ Filter the pipeline statuses to get the last time the pipeline was run succesfully. """
        return max([
            pipeline.startDate.__root__
            for pipeline in pipeline_statuses
            if pipeline.pipelineState == PipelineState.success and pipeline.startDate
        ])

    def _add_safety_margin(self, last_success_timestamp: int) -> int:
        """ Add some safety margin to the last successful run timestamp based on the 'safety_margin_days'. """
        # Hours * Minutes * Seconds * Milliseconds
        milliseconds_in_one_day = 24 * 60 * 60 * 1000

        return last_success_timestamp - (self.safety_margin_days * milliseconds_in_one_day)

    def create(self) -> IncrementalConfig:
        """ Creates a new IncrementalConfig using the historical runs of the pipeline.
        If no previous successful runs are found within the time period it will disable the incremental ingestion.
        """
        try:
            if not self.incremental:
                return IncrementalConfig(enabled=False)
            if not self.pipeline_name:
                return IncrementalConfig(enabled=False)

            pipeline_statuses = self._get_pipeline_statuses()

            if not pipeline_statuses:
                return IncrementalConfig(enabled=False)

            last_success_timestamp = self._get_last_success_timestamp(pipeline_statuses)

            if not last_success_timestamp:
                return IncrementalConfig(enabled=False)

            return IncrementalConfig(enabled=True, start_timestamp=self._add_safety_margin(last_success_timestamp))
        except Exception as exc:
            logger.debug(traceback.format_exc())
            logger.info("Couldn't create the IncrementalConfig due to %s. Proceeding Full Extraction.", exc)
            return IncrementalConfig(enabled=False)
