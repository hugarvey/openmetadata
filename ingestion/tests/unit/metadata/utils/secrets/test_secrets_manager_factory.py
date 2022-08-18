#  Copyright 2022 Collate
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
Test Secrets Manager Factory
"""
from unittest import TestCase

from unit.metadata.utils.secrets.test_secrets_manager import TestSecretsManager

from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
    SecretsManagerProvider,
)
from metadata.utils.secrets.secrets_manager_factory import get_secrets_manager
from metadata.utils.singleton import Singleton


class TestSecretsManagerFactory(TestCase):
    @classmethod
    def setUp(cls) -> None:
        Singleton.clear_all()

    def test_get_not_implemented_secret_manager(self):
        with self.assertRaises(NotImplementedError) as not_implemented_error:
            om_connection: OpenMetadataConnection = (
                TestSecretsManager.External.build_open_metadata_connection(
                    SecretsManagerProvider.local
                )
            )
            om_connection.secretsManagerProvider = "aws"
            get_secrets_manager(om_connection)
            self.assertEqual(
                "[any] is not implemented.", not_implemented_error.exception
            )

    def test_all_providers_has_implementation(self):
        secret_manager_providers = [
            secret_manager_provider
            for secret_manager_provider in SecretsManagerProvider
        ]
        for secret_manager_provider in secret_manager_providers:
            open_metadata_connection: OpenMetadataConnection = OpenMetadataConnection(
                secretsManagerProvider=secret_manager_provider,
                hostPort="http://localhost:8585",
            )
            assert get_secrets_manager(open_metadata_connection) is not None
