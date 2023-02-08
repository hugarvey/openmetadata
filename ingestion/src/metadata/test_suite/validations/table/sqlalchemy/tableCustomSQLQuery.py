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
Validator for column value length to be between test case
"""

import collections
import traceback
from typing import cast

from sqlalchemy import text

from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.test_suite.validations.base_test_handler import BaseTestHandler
from metadata.test_suite.validations.mixins.sqa_validator_mixin import SQAValidatorMixin
from metadata.utils.logger import test_suite_logger

logger = test_suite_logger()


class TableCustomSQLQueryValidator(BaseTestHandler, SQAValidatorMixin):
    """ "Validator for column value mean to be between test case"""

    def compare(self, expected_names, actual_names) -> bool:
        return collections.Counter(expected_names) == collections.Counter(actual_names)

    def run_validation(self) -> TestCaseResult:
        """Run validation for the given test case

        Returns:
            TestCaseResult:
        """
        sql_expression = self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            "sqlExpression",
            str,
        )
        sql_expression = cast(str, sql_expression)  # satisfy mypy

        try:
            rows = self.runner._session.execute(  # pylint: disable=protected-access
                text(sql_expression)
            ).all()
        except ValueError as exc:
            msg = f"Error computing {self.test_case.name} for {self.runner.table.__tablename__}: {exc}"  # type: ignore
            logger.debug(traceback.format_exc())
            logger.warning(msg)
            return self.get_test_case_result_object(
                self.execution_date,
                TestCaseStatus.Aborted,
                msg,
                [TestResultValue(name="resultRowCount", value=None)],
            )

        if not rows:
            status = TestCaseStatus.Success
            result_value = 0
        else:
            status = TestCaseStatus.Failed
            result_value = len(rows)

        return self.get_test_case_result_object(
            self.execution_date,
            status,
            f"Found {result_value} row(s). Test query is expected to return 0 row.",
            [TestResultValue(name="resultRowCount", value=str(result_value))],
        )
