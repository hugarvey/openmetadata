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
Helper module to handle data sampling
for the profiler
"""
from sqlalchemy import inspect, or_, text

from metadata.profiler.orm.functions.modulo import ModuloFn
from metadata.profiler.orm.functions.random_num import RandomNumFn
from metadata.profiler.orm.registry import FLOAT_SET
from metadata.profiler.processor.handle_partition import RANDOM_LABEL
from metadata.profiler.processor.sampler.sqlalchemy.sampler import SQASampler


class TrinoSampler(SQASampler):
    """
    Generates a sample of the data to not
    run the query in the whole table.
    """

    def random_sampler_where_clause_(self, query):
        sqa_columns = [col for col in inspect(self.table).c if col.name != RANDOM_LABEL]
        return query.where(
            or_(
                *[
                    text(f"is_nan({cols}) = False")
                    for cols in sqa_columns
                    if type(cols.type) in FLOAT_SET
                ]
            )
        )
