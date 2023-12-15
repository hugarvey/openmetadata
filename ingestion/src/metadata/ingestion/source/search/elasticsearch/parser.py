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
Utils module to parse the jsonschema
"""

import traceback
from typing import List, Optional

from metadata.generated.schema.entity.data.searchIndex import DataType, SearchIndexField
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


# If any type of ES field is not recognized mark it as unknown
# pylint: disable=no-member,unused-argument,protected-access
@classmethod
def _missing_(cls, value):
    return cls.UNKNOWN


DataType._missing_ = _missing_


def parse_es_index_mapping(mapping: dict) -> Optional[List[SearchIndexField]]:
    """
    Recursively convert the parsed schema into required models
    """
    field_models = []
    try:
        properties = mapping.get("properties", {})
        for key, value in properties.items():
            data_type = (
                DataType(value.get("type").upper())
                if value.get("type")
                else DataType.OBJECT
            )
            field_models.append(
                SearchIndexField(
                    name=key,
                    dataType=data_type,
                    dataTypeDisplay=value.get("type"),
                    description=value.get("description"),
                    children=parse_es_index_mapping(value)
                    if value.get("properties")
                    else None,
                )
            )
    except Exception as exc:  # pylint: disable=broad-except
        logger.debug(traceback.format_exc())
        logger.warning(f"Unable to parse the index properties: {exc}")

    return field_models
