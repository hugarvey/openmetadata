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

from abc import abstractmethod
import traceback
from typing import Union

from metadata.generated.schema.tests.basic import (TestCaseResult,
                                                   TestCaseStatus,
                                                   TestResultValue)
from metadata.orm_profiler.metrics.registry import Metrics
from metadata.test_suite.validations.base_test_handler import BaseTestValidator
from metadata.utils.logger import test_suite_logger
from metadata.utils.sqa_like_column import SQALikeColumn
from sqlalchemy import Column

logger = test_suite_logger()

VALUE_COUNT = "valueCount"
UNIQUE_COUNT = "uniqueCount"

class BaseColumnValuesToBeUniqueValidator(BaseTestValidator):
    """ "Validator for column values sum to be between test case"""

    def run_validation(self) -> TestCaseResult:
        """Run validation for the given test case

        Returns:
            TestCaseResult:
        """
        try:
            column: Union[SQALikeColumn, Column] = self._get_column_name()
            count = self._run_results(Metrics.COUNT, column)
            unique_count = self._get_unique_count(Metrics.UNIQUE_COUNT, column)
        except (ValueError, RuntimeError) as exc:
            msg = f"Error computing {self.test_case.fullyQualifiedName}: {exc}"  # type: ignore
            logger.debug(traceback.format_exc())
            logger.warning(msg)
            return self.get_test_case_result_object(
                self.execution_date,
                TestCaseStatus.Aborted,
                msg,
                [
                    TestResultValue(name=VALUE_COUNT, value=None),
                    TestResultValue(name=UNIQUE_COUNT, value=None),
                ],
            )

        return self.get_test_case_result_object(
            self.execution_date,
            self.get_test_case_status(count == unique_count),
            f"Found valuesCount={count} vs. uniqueCount={unique_count}. "
            "Both counts should be equal for column values to be unique.",
            [
                TestResultValue(name=VALUE_COUNT, value=str(count)),
                TestResultValue(name=UNIQUE_COUNT, value=str(unique_count)),
            ],
        )

    @abstractmethod
    def _get_column_name(self):
        raise NotImplementedError

    @abstractmethod
    def _run_results(self, metric: Metrics, column: Union[SQALikeColumn, Column]):
        raise NotImplementedError

    @abstractmethod
    def _get_unique_count(self, metric: Metrics, column: Union[SQALikeColumn, Column]):
        raise NotImplementedError
