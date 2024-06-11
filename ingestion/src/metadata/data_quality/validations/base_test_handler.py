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
Base validator class
"""

from __future__ import annotations

import reprlib
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Callable, List, Optional, Type, TypeVar, Union

from metadata.data_quality.validations.runtime_param_setter.param_setter import (
    RuntimeParameterSetter,
)
from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.generated.schema.tests.testCase import TestCase, TestCaseParameterValue
from metadata.profiler.processor.runner import QueryRunner

T = TypeVar("T", bound=Callable)
R = TypeVar("R")


class BaseTestValidator(ABC):
    """Abstract class for test case handlers"""

    runtime_parameter_setter: Optional[Type[RuntimeParameterSetter]] = None

    def __init__(
            self,
            runner: QueryRunner,
            test_case: TestCase,
            execution_date: Union[datetime, float],
    ) -> None:
        self.runner = runner
        self.test_case = test_case
        self.execution_date = execution_date

    @abstractmethod
    def run_validation(self) -> TestCaseResult:
        """Run validation for the given test case

        Returns:
            TestCaseResult:
        """
        raise NotImplementedError

    def get_test_case_param_value(
            self,
            test_case_param_vals: list[TestCaseParameterValue],
            name: str,
            type_: T,
            default: Optional[R] = None,
            pre_processor: Optional[Callable] = None,
    ) -> Optional[Union[R, T]]:
        """Give a column and a type return the value with the appropriate type casting for the
        test case definition.

        Args:
            test_case: the test case
            type_ (Union[float, int, str]): type for the value
            name (str): column name
            default (_type_, optional): Default value to return if column is not found
            pre_processor: pre processor function/type to use against the value before casting to type_
        """
        value = next(
            (param.value for param in test_case_param_vals if param.name == name), None
        )

        if not value:
            return default if default is not None else None

        if not pre_processor:
            return type_(value)

        pre_processed_value = pre_processor(value)
        return type_(pre_processed_value)

    def get_test_case_result_object(  # pylint: disable=too-many-arguments
            self,
            execution_date: Union[datetime, float],
            status: TestCaseStatus,
            result: str,
            test_result_value: List[TestResultValue],
            row_count: Optional[int] = None,
            failed_rows: Optional[int] = None,
            passed_rows: Optional[int] = None,
    ) -> TestCaseResult:
        """Returns a TestCaseResult object with the given args

        Args:
            execution_date (Union[datetime, float]): test case execution datetime
            status (TestCaseStatus): failed, success, aborted
            result (str): test case result
            test_result_value (List[TestResultValue]): test result value to display in UI
        Returns:
            TestCaseResult:
        """
        test_case_result = TestCaseResult(
            timestamp=execution_date,  # type: ignore
            testCaseStatus=status,
            result=result,
            testResultValue=test_result_value,
            sampleData=None,
        )

        if (row_count is not None and row_count != 0) and (
                # we'll need at least one of these to be not None to compute the other
                (failed_rows is not None)
                or (passed_rows is not None)
        ):
            passed_rows = passed_rows if passed_rows is not None else (row_count - failed_rows)  # type: ignore
            failed_rows = (
                failed_rows if failed_rows is not None else (row_count - passed_rows)
            )
            test_case_result.passedRows = passed_rows
            test_case_result.failedRows = failed_rows
            test_case_result.passedRowsPercentage = (passed_rows / row_count) * 100
            test_case_result.failedRowsPercentage = (failed_rows / row_count) * 100  # type: ignore

        return test_case_result

    def format_column_list(self, status: TestCaseStatus, cols: List):
        """Format column list based on the test status

        Args:
            cols: list of columns
        """
        if status == TestCaseStatus.Success:
            return reprlib.repr(cols)
        return cols

    def get_test_case_status(self, condition: bool) -> TestCaseStatus:
        """Returns TestCaseStatus based on condition

        Args:
            condition (bool): condition to check
        Returns:
            TestCaseStatus:
        """
        return TestCaseStatus.Success if condition else TestCaseStatus.Failed

    def get_min_bound(self, param_name: str):
        """get min value for max value in column test case"""
        return self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            param_name,
            float,
            default=float("-inf"),
        )

    def get_max_bound(self, param_name: str):
        """get max value for max value in column test case"""
        return self.get_test_case_param_value(
            self.test_case.parameterValues,  # type: ignore
            param_name,
            float,
            default=float("inf"),
        )
