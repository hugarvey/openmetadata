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
Profiler File Sink
"""
from pathlib import Path

from metadata.config.common import ConfigModel
from metadata.ingestion.api.common import Entity
from metadata.ingestion.api.sink import Sink
from metadata.profiler.api.models import ProfilerResponse
from metadata.utils.constants import UTF_8
from metadata.utils.logger import profiler_logger

logger = profiler_logger()


class FileSinkConfig(ConfigModel):
    filename: str


class FileSink(Sink[Entity]):
    """
    Helper sink to save profiler
    results in a file for analysis
    """

    config: FileSinkConfig

    def __init__(
        self,
        config: FileSinkConfig,
    ):
        super().__init__()
        self.config = config

        self.fpath = Path(self.config.filename)

        # Build the path if it does not exist
        if not self.fpath.parent.is_dir():
            Path(self.config.filename).mkdir(parents=True, exist_ok=True)
        self.wrote_something = False

    @classmethod
    def create(cls, config_dict: dict, _):
        config = FileSinkConfig.parse_obj(config_dict)
        return cls(config)

    def write_record(self, record: ProfilerResponse) -> None:
        if self.wrote_something:
            self.write_file("\n")

        self.wrote_something = self.write_file(
            f"Profile for: \
                                               {record.table.fullyQualifiedName.__root__}\
                                               \n{record.profile.json()}\n"
        )

        if self.wrote_something:
            self.status.records_written(record.table.fullyQualifiedName.__root__)

    def close(self):
        self.write_file("\n]")

    def write_file(self, content):
        try:
            with self.fpath.open("w", encoding=UTF_8) as file:
                try:
                    file.write(content)
                    return True
                except (IOError, OSError):
                    return False
        except (FileNotFoundError, PermissionError, OSError):
            return False
