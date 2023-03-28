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
Abstract BulkSink definition to build a Workflow
"""
from abc import ABCMeta, abstractmethod
from dataclasses import dataclass
from typing import Any

from .closeable import Closeable
from .status import Status


class BulkSinkStatus(Status):
    def records_written(self, record: Any) -> None:
        self.records.append(record)

    def warning(self, info: Any) -> None:
        self.warnings.append(info)


@dataclass  # type: ignore[misc]
class BulkSink(Closeable, metaclass=ABCMeta):
    """
    BulkSink class
    """

    status: BulkSinkStatus

    def __init__(self):
        self.status = BulkSinkStatus()

    @classmethod
    @abstractmethod
    def create(cls, config_dict: dict, metadata_config: dict) -> "BulkSink":
        pass

    @abstractmethod
    def write_records(self) -> None:
        pass

    def get_status(self) -> BulkSinkStatus:
        return self.status

    @abstractmethod
    def close(self) -> None:
        pass
