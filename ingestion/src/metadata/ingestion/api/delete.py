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
Delete methods
"""
import traceback
from typing import Dict, Iterable, Optional, Type

from metadata.ingestion.api.models import Either
from metadata.generated.schema.entity.services.ingestionPipelines.status import StackTraceError
from metadata.ingestion.models.delete_entity import DeleteEntity
from metadata.ingestion.ometa.ometa_api import OpenMetadata, T
from metadata.utils.logger import utils_logger

logger = utils_logger()


def delete_entity_from_source(
    metadata: OpenMetadata,
    entity_type: Type[T],
    entity_source_state,
    mark_deleted_entity: bool = True,
    params: Optional[Dict[str, str]] = None,
) -> Iterable[Either[DeleteEntity]]:
    """
    Method to delete the entities
    :param metadata: OMeta client
    :param entity_type: Pydantic Entity model
    :param entity_source_state: Current state of the service
    :param mark_deleted_entity: Option to mark the entity as deleted or not
    :param params: param to fetch the entity state
    """
    try:
        entity_state = metadata.list_all_entities(entity=entity_type, params=params)
        for entity in entity_state:
            if str(entity.fullyQualifiedName.__root__) not in entity_source_state:
                yield Either(
                    right=DeleteEntity(
                        entity=entity,
                        mark_deleted_entities=mark_deleted_entity,
                    )
                )
    except Exception as exc:
        yield Either(
            left=StackTraceError(
                name="Delete Entity",
                error=f"Error deleting {entity_type.__class__}: {exc}",
                stackTrace=traceback.format_exc(),
            )
        )
