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
Pydantic classes overwritten defaults ones of code generation.

This classes are used in the generated module, which should have NO
dependencies against any other metadata package. This class should
be self-sufficient with only pydantic at import time.
"""
import logging
import warnings
from typing import Any, Dict

from pydantic.types import OptionalInt, SecretStr
from pydantic.utils import update_not_none
from pydantic.validators import constr_length_validator, str_validator

logger = logging.getLogger("metadata")

SECRET = "secret:"


class CustomSecretStr(SecretStr):
    """
    Custom SecretStr class which use the configured Secrets Manager to retrieve the actual values.

    If the secret string value starts with `config:` it will use the rest of the string as secret id to search for it
    in the secrets store.
    """

    min_length: OptionalInt = None
    max_length: OptionalInt = None

    @classmethod
    def __modify_schema__(cls, field_schema: Dict[str, Any]) -> None:
        update_not_none(
            field_schema,
            type="string",
            writeOnly=True,
            format="password",
            minLength=cls.min_length,
            maxLength=cls.max_length,
        )

    @classmethod
    def __get_validators__(cls) -> "CallableGenerator":
        yield cls.validate
        yield constr_length_validator

    @classmethod
    def validate(cls, value: Any) -> "CustomSecretStr":
        if isinstance(value, cls):
            return value
        value = str_validator(value)
        return cls(value)

    def __init__(self, value: str):
        self._secret_value = value

    def __repr__(self) -> str:
        return f"SecretStr('{self}')"

    def __len__(self) -> int:
        return len(self._secret_value)

    def display(self) -> str:
        warnings.warn(
            "`secret_str.display()` is deprecated, use `str(secret_str)` instead",
            DeprecationWarning,
        )
        return str(self)

    def get_secret_value(self, skip_secret_manager: bool = False) -> str:
        """
        This function should only be called after the SecretsManager has properly
        been initialized (e.g., after instantiating the ometa client).

        Since the SecretsManagerFactory is a singleton, getting it here
        will pick up the object with all the necessary info already in it.
        """
        # Importing inside function to avoid circular import error
        from metadata.utils.secrets.secrets_manager_factory import (  # pylint: disable=import-outside-toplevel,cyclic-import
            SecretsManagerFactory,
        )

        if (
            not skip_secret_manager
            and self._secret_value.startswith(SECRET)
            and SecretsManagerFactory().get_secrets_manager()
        ):
            secret_id = self._secret_value.replace(SECRET, "")
            try:
                return (
                    SecretsManagerFactory()
                    .get_secrets_manager()
                    .get_string_value(secret_id)
                )
            except Exception as exc:
                logger.error(
                    f"Secret value [{secret_id}] not present in the configured secrets manager: {exc}"
                )
        return self._secret_value
