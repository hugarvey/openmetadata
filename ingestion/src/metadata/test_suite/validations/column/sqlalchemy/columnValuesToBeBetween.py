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
# pylint: disable=invalid-name

"""
Validator for column values sum to be between test case
"""

import traceback
from datetime import datetime

from sqlalchemy import Column, inspect
from sqlalchemy.sql.sqltypes import DATE, DATETIME, TIMESTAMP

from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.orm_profiler.metrics.registry import Metrics
from metadata.test_suite.validations.base_test_handler import BaseTestHandler
from metadata.test_suite.validations.mixins.sqa_validator_mixin import SQAValidatorMixin
from metadata.utils.logger import test_suite_logger
from metadata.utils.time_utils import convert_timestamp

logger = test_suite_logger()


class ColumnValuesToBeBetweenValidator(BaseTestHandler, SQAValidatorMixin):
    """ "Validator for column values sum to be between test case"""

    def run_validation(self) -> TestCaseResult:
        """Run validation for the given test case

        Returns:
            TestCaseResult:
        """
        try:
            column: Column = self.get_column_name(
                self.test_case.entityLink.__root__,
                inspect(self.runner.table).c,
            )
            min_res = self.run_query_results(self.runner, Metrics.MIN, column)
            max_res = self.run_query_results(self.runner, Metrics.MAX, column)
        except ValueError as exc:
            msg = f"Error computing {self.test_case.name} for {self.runner.table.__tablename__}: {exc}"  # type: ignore
            logger.debug(traceback.format_exc())
            logger.warning(msg)
            return self.get_test_case_result_object(
                self.execution_date,
                TestCaseStatus.Aborted,
                msg,
                [
                    TestResultValue(name="min", value=None),
                    TestResultValue(name="max", value=None),
                ],
            )

        min_bound = self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            "minValue",
            datetime.fromtimestamp
            if isinstance(column.type, (TIMESTAMP, DATE, DATETIME))
            else float,
            default=datetime.min
            if isinstance(column.type, (TIMESTAMP, DATE, DATETIME))
            else float("-inf"),
            pre_processor=convert_timestamp
            if isinstance(column.type, (TIMESTAMP, DATE, DATETIME))
            else None,
        )

        max_bound = self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            "maxValue",
            datetime.fromtimestamp
            if isinstance(column.type, (TIMESTAMP, DATE, DATETIME))
            else float,
            default=datetime.max
            if isinstance(column.type, (TIMESTAMP, DATE, DATETIME))
            else float("-inf"),
            pre_processor=convert_timestamp
            if isinstance(column.type, (TIMESTAMP, DATE, DATETIME))
            else None,
        )

        return self.get_test_case_result_object(
            self.execution_date,
            TestCaseStatus.Success
            if min_res >= min_bound and max_res <= max_bound
            else TestCaseStatus.Failed,
            f"Found min={min_res}, max={max_res} vs. the expected min={min_bound}, max={max_bound}.",
            [
                TestResultValue(name="min", value=str(min_res)),
                TestResultValue(name="max", value=str(max_res)),
            ],
        )
