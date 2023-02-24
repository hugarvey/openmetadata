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
Validator for column values to match regex test case
"""

import traceback
from abc import abstractmethod
from typing import Union

from sqlalchemy import Column

from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.orm_profiler.metrics.registry import Metrics
from metadata.test_suite.validations.base_test_handler import BaseTestValidator
from metadata.utils.logger import test_suite_logger
from metadata.utils.sqa_like_column import SQALikeColumn

logger = test_suite_logger()

LIKE_COUNT = "likeCount"


class BaseColumnValuesToMatchRegexValidator(BaseTestValidator):
    """Validator for column values to match regex test case"""

    def run_validation(self) -> TestCaseResult:
        """Run validation for the given test case

        Returns:
            TestCaseResult:
        """
        regex: str = self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            "regex",
            str,
        )
        try:
            column: Union[SQALikeColumn, Column] = self._get_column_name()
            count = self._run_results(Metrics.COUNT, column)
            match_count = self._run_results(
                Metrics.REGEX_COUNT, column, expression=regex
            )
        except (ValueError, RuntimeError) as exc:
            msg = f"Error computing {self.test_case.fullyQualifiedName}: {exc}"  # type: ignore
            logger.debug(traceback.format_exc())
            logger.warning(msg)
            return self.get_test_case_result_object(
                self.execution_date,
                TestCaseStatus.Aborted,
                msg,
                [TestResultValue(name=LIKE_COUNT, value=None)],
            )

        return self.get_test_case_result_object(
            self.execution_date,
            self.get_test_case_status(count == match_count),
            f"Found {match_count} value(s) matching regex pattern vs {count} value(s) in the column.",
            [TestResultValue(name=LIKE_COUNT, value=str(match_count))],
        )

    @abstractmethod
    def _get_column_name(self):
        raise NotImplementedError

    @abstractmethod
    def _run_results(
        self, metric: Metrics, column: Union[SQALikeColumn, Column], **kwargs
    ):
        raise NotImplementedError
