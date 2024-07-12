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
Builder defining the structure of builders for validators for Pandas sources
"""

from datetime import datetime
from typing import TYPE_CHECKING, List, Type

from metadata.data_quality.builders.i_validator_builder import IValidatorBuilder
from metadata.data_quality.validations.base_test_handler import BaseTestValidator
from metadata.generated.schema.tests.testCase import TestCase
from metadata.utils.importer import import_test_case_class

if TYPE_CHECKING:
    from pandas import DataFrame


class PandasValidatorBuilder(IValidatorBuilder):
    """Builder for Pandas validators"""

    def __init__(
        self, runner: List["DataFrame"], test_case: TestCase, entity_type: str
    ) -> None:
        """Builder object for Pandas validators. This builder is used to create a validator object

        Args:
            runner (List["DataFrame"]): The runner object
            test_case (TestCase): The test case object
            entity_type (str): one of COLUMN or TABLE -- fetched from the test definition
        """
        self._test_case = test_case
        self.runner = runner
        self.validator_cls: Type[BaseTestValidator] = import_test_case_class(
            entity_type,
            "pandas",
            self.test_case.testDefinition.fullyQualifiedName,  # type: ignore
        )
        self.reset()

    def reset(self):
        """Reset the builder"""
        self._validator = self.validator_cls(
            self.runner,
            test_case=self.test_case,
            execution_date=int(datetime.now().timestamp() * 1000),
        )

    @property
    def validator(self) -> BaseTestValidator:
        """Return the validator"""
        return self._validator

    @property
    def test_case(self) -> TestCase:
        """Return the test case"""
        return self._test_case
