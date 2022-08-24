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
Main class to run data tests
"""


from metadata.generated.schema.tests.testCase import TestCase

from metadata.interfaces.interface_protocol import InterfaceProtocol
from metadata.test_suite.runner.models import TestCaseResultResponse


class DataTestsRunner:
    """class to execute the test validation"""

    def __init__(self, test_runner_interface: InterfaceProtocol):
        self.test_runner_interace = test_runner_interface


    def run_and_handle(self, test_case: TestCase):
        """run and handle test case validation"""
        test_result = self.test_runner_interace.run_test_case(
            test_case,
        )

        return TestCaseResultResponse(
            testCaseResult=test_result,
            testCase=test_case
        )
