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
TableRowCountToEqual validation implementation
"""
import traceback
from datetime import datetime
from functools import singledispatch
from typing import Union

# pylint: disable=duplicate-code
from pandas import DataFrame

from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.generated.schema.tests.testCase import TestCase
from metadata.orm_profiler.metrics.registry import Metrics
from metadata.orm_profiler.profiler.runner import QueryRunner
from metadata.utils.column_base_model import fetch_column_obj
from metadata.utils.logger import test_suite_logger

logger = test_suite_logger()


@singledispatch
def table_row_count_to_equal(
    test_case: TestCase, execution_date: Union[datetime, float], runner
):
    raise NotImplementedError


@table_row_count_to_equal.register
def _(
    runner: QueryRunner,
    test_case: TestCase,
    execution_date: Union[datetime, float],
) -> TestCaseResult:
    """
    Validate row count metric
    :param test_case: TableRowCountToEqual
    :param table_profile: should contain row count metric
    :param execution_date: Datetime when the tests ran
    :return: TestCaseResult with status and results
    """

    try:
        row_count_dict = dict(
            runner.dispatch_query_select_first(Metrics.ROW_COUNT.value().fn())
        )
        row_count_value = row_count_dict.get(Metrics.ROW_COUNT.name)

    except Exception as exc:
        msg = (
            f"Error computing {test_case.name} for {runner.table.__tablename__}: {exc}"
        )
        logger.debug(traceback.format_exc())
        logger.warning(msg)
        return TestCaseResult(
            timestamp=execution_date,
            testCaseStatus=TestCaseStatus.Aborted,
            result=msg,
            testResultValue=[TestResultValue(name="rowCount", value=None)],
        )

    value = next(
        int(param_value.value)
        for param_value in test_case.parameterValues
        if param_value.name == "value"
    )

    status = (
        TestCaseStatus.Success if row_count_value == value else TestCaseStatus.Failed
    )
    result = f"Found {row_count_value} rows vs. the expected {value}"

    return TestCaseResult(
        timestamp=execution_date,
        testCaseStatus=status,
        result=result,
        testResultValue=[TestResultValue(name="rowCount", value=str(row_count_value))],
    )


@table_row_count_to_equal.register
def _(test_case: TestCase, execution_date: Union[datetime, float], runner: DataFrame):
    column_obj = fetch_column_obj(test_case.entityLink.__root__, runner)

    row_count_value = Metrics.ROW_COUNT.value(column_obj).dl_fn(runner)
    value = next(
        int(param_value.value)
        for param_value in test_case.parameterValues
        if param_value.name == "value"
    )

    status = (
        TestCaseStatus.Success if row_count_value == value else TestCaseStatus.Failed
    )
    result = f"Found {row_count_value} rows vs. the expected {value}"

    return TestCaseResult(
        timestamp=execution_date,
        testCaseStatus=status,
        result=result,
        testResultValue=[TestResultValue(name="rowCount", value=str(row_count_value))],
    )
