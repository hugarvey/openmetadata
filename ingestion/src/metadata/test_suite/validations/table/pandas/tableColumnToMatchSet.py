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

from metadata.generated.schema.tests.basic import (TestCaseResult,
                                                   TestCaseStatus,
                                                   TestResultValue)
from metadata.test_suite.validations.base_test_handler import BaseTestValidator
from metadata.test_suite.validations.mixins.pandas_validator_mixin import \
    PandasValidatorMixin
from metadata.utils.entity_link import get_table_fqn
from metadata.utils.logger import test_suite_logger

logger = test_suite_logger()


class TableColumnToMatchSetValidator(BaseTestValidator, PandasValidatorMixin):
    """ "Validator for column value mean to be between test case"""

    def compare(self, expected_names, actual_names) -> bool:
        return collections.Counter(expected_names) == collections.Counter(actual_names)

    def run_validation(self) -> TestCaseResult:
        """Run validation for the given test case

        Returns:
            TestCaseResult:
        """
        try:
            names = list(self.runner.columns)
            if not names:
                raise ValueError(
                    f"Column names for test case {self.test_case.name} returned None"
                )
        except Exception as exc:
            msg = (
                f"Error computing {self.test_case.name} for "
                f"{get_table_fqn(self.test_case.entityLink.__root__)}: {exc}"  # type: ignore
            )
            logger.debug(traceback.format_exc())
            logger.warning(msg)
            return self.get_test_case_result_object(
                self.execution_date,
                TestCaseStatus.Aborted,
                msg,
                [TestResultValue(name="columnCount", value=None)],
            )

        expected_names = self.get_test_case_param_value(
            self.test_case.parameterValues, "columnNames", str  # type: ignore
        )

        expected_names = (
            [item.strip() for item in expected_names.split(",")]
            if expected_names
            else []
        )

        ordered = self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            "ordered",
            bool,
            default=False,
        )

        if ordered:
            names_match = expected_names == names
        else:
            names_match = self.compare(expected_names, names)

        status = self.get_test_case_status(names_match)
        result_value = 1 if status == TestCaseStatus.Success else 0

        result = (
            f"Found {self.format_column_list(status, names)} column vs. "
            f"the expected column names {self.format_column_list(status, expected_names)}."
        )

        return self.get_test_case_result_object(
            self.execution_date,
            status,
            result,
            [TestResultValue(name="columnNames", value=str(result_value))],
        )
