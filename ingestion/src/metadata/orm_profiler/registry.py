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
Registry definition.

A Registry is a "smarter" Enum, which we'll
use to control what classes we have available to
use, validating that they are of proper type,
and we can easily access the desired values.
"""

from enum import Enum

from sqlalchemy.sql.sqltypes import TypeDecorator

from metadata.orm_profiler.metrics.core import Metric


class MetricRegistry(Enum):
    """
    Lets us __call__ values.
    Used for our profiler registries of metrics.

    Instead of:
    - StaticMetrics.MIN.value(col)
    We can use:
    - StaticMetrics.MIN(col)
    """

    def __init__(self, metric):
        if not issubclass(metric, Metric):
            raise TypeError(
                "Only Metrics can be part of the Metric Registry,"
                + f" but found {type(metric)} instead."
            )
        self.metric = metric

    def __call__(self, *args, **kwargs):
        """
        Allow to __init__ the mapped class directly
        """
        return self.value(*args, **kwargs)

    @property
    def name(self) -> str:
        """
        Override the default `name` on Enums
        to use the mapped class name instead.

        name is a classmethod on Metrics, so
        we do not need to __init__ here.
        """
        return self.value.name()

    def __str__(self):
        return self.value.name()


class TypeRegistry(Enum):
    """
    Used to validate that we are passing proper
    TypeDecorators to our Type Registry
    """

    def __init__(self, _type):
        if not issubclass(_type, TypeDecorator):
            raise TypeError(
                "Only Metrics can be part of the Metric Registry,"
                + f" but found {type(_type)} instead."
            )
        self._type = _type
