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
AVG Metric definition
"""
# pylint: disable=duplicate-code

import traceback
import pandas as pd
from sqlalchemy import column, func
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.functions import GenericFunction

from metadata.orm_profiler.metrics.core import CACHE, StaticMetric, _label
from metadata.orm_profiler.orm.functions.length import LenFn
from metadata.orm_profiler.orm.registry import (
    CONCATENABLE_DICT,
    QUANTIFIABLE_DICT,
    Dialects,
    is_concatenable,
    is_quantifiable,
)
from metadata.utils.logger import profiler_logger

logger = profiler_logger()

# pylint: disable=invalid-name
class avg(GenericFunction):
    name = "avg"
    inherit_cache = CACHE


@compiles(avg, Dialects.ClickHouse)
def _(element, compiler, **kw):
    """Handle case for empty table. If empty, clickhouse returns NaN"""
    proc = compiler.process(element.clauses, **kw)
    return f"if(isNaN(avg({proc})), null, avg({proc}))"


class Mean(StaticMetric):
    """
    AVG Metric

    Given a column, return the AVG value.

    - For a quantifiable value, return the usual AVG
    - For a concatenable (str, text...) return the AVG length
    """

    @classmethod
    def name(cls):
        return "mean"

    @property
    def metric_type(self):
        return float

    @_label
    def fn(self):
        if is_quantifiable(self.col.type):
            return func.avg(column(self.col.name))

        if is_concatenable(self.col.type):
            return func.avg(LenFn(column(self.col.name)))

        logger.debug(
            f"Don't know how to process type {self.col.type} when computing MEAN"
        )
        return None

    @_label
    def dl_fn(self, data_frame=None):
        try:
            if self.col.dataType in QUANTIFIABLE_DICT:
                return data_frame[self.col.name.__root__].dropna().mean().tolist()

            if self.col.dataType in CONCATENABLE_DICT:
                return (
                    pd.DataFrame(
                        [
                            len(concatenable_data) if concatenable_data and not isinstance(concatenable_data, float) else concatenable_data
                            for concatenable_data in data_frame[
                                self.col.name.__root__
                            ].dropna().values.tolist()
                        ]
                    )
                    .mean()
                    .tolist()[0]
                )
        except Exception as err:
            logger.debug(traceback.format_exc())
            logger.warning(
                f"Don't know how to process type {self.col.dataType.value} when computing MEAN, Error: {err}"
            )
            return None
