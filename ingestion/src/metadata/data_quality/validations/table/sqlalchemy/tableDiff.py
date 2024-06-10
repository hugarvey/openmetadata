#  Copyright 2024 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
# pylint: disable=missing-module-docstring
import traceback
from itertools import islice
from typing import Optional

import data_diff
from data_diff.diff_tables import DiffResultWrapper

from metadata.data_quality.validations.base_test_handler import BaseTestValidator
from metadata.data_quality.validations.mixins.sqa_validator_mixin import (
    SQAValidatorMixin,
)
from metadata.data_quality.validations.runtime_param_setter.table_diff_params_setter import (
    TableDiffParamsSetter,
)
from metadata.data_quality.validations.table.sqlalchemy.models import (
    TableDiffRuntimeParameters,
)
from metadata.generated.schema.tests.basic import (
    TestCaseResult,
    TestCaseStatus,
    TestResultValue,
)
from metadata.utils.logger import test_suite_logger

logger = test_suite_logger()


class TableDiffValidator(BaseTestValidator, SQAValidatorMixin):
    """
    Compare two tables and fail if the number of differences exceeds a threshold
    """

    runtime_parameter_setter = TableDiffParamsSetter

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.runtime_params: TableDiffRuntimeParameters = self.get_runtime_params()

    def run_validation(self) -> TestCaseResult:
        try:
            return self._run()
        except KeyError as e:
            return TestCaseResult(
                timestamp=self.execution_date,  # type: ignore
                testCaseStatus=self.get_test_case_status(False),
                result=f"MISMATCHED_COLUMNS: One of the tables is missing the column: '{e}'\n"
                "Use two tables with the same schema or provide the extraColumns parameter.",
                testResultValue=[],
            )
        except Exception as e:
            # TODO should I return a failed test case here?
            logger.debug(
                f"Unexpected error while running the table diff test: {str(e)}\n{traceback.format_exc()}"
            )
            return TestCaseResult(
                timestamp=self.execution_date,  # type: ignore
                testCaseStatus=TestCaseStatus.Failed,
                result=f"ERROR: Unexpected error while running the table diff test: {str(e)}",
                testResultValue=[],
            )

    def _run(self) -> TestCaseResult:
        threshold = self.get_test_case_param_value(
            self.test_case.parameterValues, "threshold", int, default=0
        )
        table_diff_iter = self.get_table_diff()

        if not threshold or self.test_case.computePassedFailedRowCount:
            stats = table_diff_iter.get_stats_dict()
            if stats["total"] > 0:
                logger.debug("Sample of failed rows:")
                for s in islice(self.get_table_diff(), 10):
                    logger.debug(s)
            test_case_result = self.get_test_case_result(stats["total"], threshold)
            count = self._compute_row_count(self.runner, None)  # type: ignore
            test_case_result.passedRows = count - stats["total"]
            test_case_result.failedRows = stats["total"]
            test_case_result.passedRowsPercentage = test_case_result.passedRows / count
            test_case_result.failedRowsPercentage = test_case_result.failedRows / count
            return test_case_result
        num_dffs = sum(1 for _ in islice(table_diff_iter, threshold))
        return self.get_test_case_result(
            num_dffs,
            threshold,
        )

    def get_table_diff(self) -> DiffResultWrapper:
        """Calls data_diff.diff_tables with the parameters from the test case."""
        table1 = data_diff.connect_to_table(
            self.runtime_params.service1Url, self.runtime_params.table1, self.runtime_params.keyColumns  # type: ignore
        )
        table2 = data_diff.connect_to_table(
            self.runtime_params.service2Url, self.runtime_params.table2, self.runtime_params.keyColumns  # type: ignore
        )

        data_diff_kwargs = {
            "key_columns": self.runtime_params.keyColumns,
            "extra_columns": self.runtime_params.extraColumns,
            "where": self.get_where(),
        }
        logger.debug(
            "Calling table diff with parameters:"  # pylint: disable=consider-using-f-string
            " table1={}, table2={}, kwargs={}".format(
                table1.table_path,
                table2.table_path,
                ",".join(f"{k}={v}" for k, v in data_diff_kwargs.items()),
            )
        )
        return data_diff.diff_tables(table1, table2, **data_diff_kwargs)  # type: ignore

    def get_where(self) -> Optional[str]:
        return self.runtime_params.whereClause

    def get_runtime_params(self) -> TableDiffRuntimeParameters:
        raw = self.get_test_case_param_value(
            self.test_case.parameterValues, "runtimeParams", str
        )
        runtime_params = TableDiffRuntimeParameters.parse_raw(raw)
        return runtime_params

    @property
    def _param_name(self):
        return "forbiddenRegex"

    def get_test_case_result(
        self,
        num_diffs: int,
        threshold: int,
    ) -> TestCaseResult:
        return TestCaseResult(
            timestamp=self.execution_date,  # type: ignore
            testCaseStatus=self.get_test_case_status(
                (threshold or num_diffs) == 0 or num_diffs < threshold
            ),
            result=f"Found {num_diffs} different rows which is more than the threshold of {threshold}",
            testResultValue=[TestResultValue(name="diffCount", value=str(num_diffs))],
            validateColumns=False,
        )
