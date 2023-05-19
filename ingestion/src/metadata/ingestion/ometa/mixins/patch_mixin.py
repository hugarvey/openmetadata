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
Mixin class containing PATCH specific methods

To be used by OpenMetadata class
"""
import json
import traceback
from typing import Dict, List, Optional, Type, TypeVar, Union

import jsonpatch
from pydantic import BaseModel

from metadata.generated.schema.entity.automations.workflow import (
    Workflow as AutomationWorkflow,
)
from metadata.generated.schema.entity.automations.workflow import WorkflowStatus
from metadata.generated.schema.entity.data.table import Column, Table, TableConstraint
from metadata.generated.schema.entity.services.connections.testConnectionResult import (
    TestConnectionResult,
)
from metadata.generated.schema.type import basic
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.generated.schema.type.tagLabel import (
    LabelType,
    State,
    TagLabel,
    TagSource,
)
from metadata.ingestion.ometa.client import REST
from metadata.ingestion.ometa.mixins.patch_mixin_utils import (
    OMetaPatchMixinBase,
    PatchField,
    PatchOperation,
    PatchPath,
    PatchValue,
)
from metadata.ingestion.ometa.utils import model_str
from metadata.utils.helpers import find_column_in_table_with_index
from metadata.utils.logger import ometa_logger

logger = ometa_logger()

T = TypeVar("T", bound=BaseModel)

OWNER_TYPES: List[str] = ["user", "team"]


def update_column_tags(
    columns: List[Column],
    column_fqn: str,
    tag_label: TagLabel,
    operation: PatchOperation,
):
    for col_index, col in enumerate(columns):
        if str(col.fullyQualifiedName.__root__).lower() == column_fqn.lower():
            if operation == PatchOperation.REMOVE:
                for tag in col.tags:
                    if tag.tagFQN == tag_label.tagFQN:
                        col.tags.remove(tag)
            else:
                col.tags.append(tag_label)
            break

        if col.children:
            update_column_tags(col.children, column_fqn, tag_label, operation)


def update_column_description(
    columns: List[Column], column_fqn: str, description: str, force: bool
):

    for col_index, col in enumerate(columns):
        if str(col.fullyQualifiedName.__root__).lower() == column_fqn.lower():
            if col.description and not force:
                logger.warning(
                    f"The entity with id [{model_str(column_fqn)}] already has a description."
                    " To overwrite it, set `force` to True."
                )
                break
            else:
                col.description = description
            break

        if col.children:
            update_column_description(col.children, column_fqn, description, force)


class OMetaPatchMixin(OMetaPatchMixinBase):
    """
    OpenMetadata API methods related to Tables.

    To be inherited by OpenMetadata
    """

    client: REST

    def patch(self, entity: Type[T], source: T, destination: T) -> Optional[T]:
        """
        Given an Entity type and Source entity and Destination entity,
        generate a Json Patch and apply patch.

        Args
            entity (T): Entity Type
            source: Source payload which is current state of the source in OpenMetadata
            destination: payload with changes applied to the source.

        Returns
            Updated Entity
        """
        try:
            patch = jsonpatch.make_patch(source, destination)
            res = self.client.patch(
                path=f"{self.get_suffix(entity)}/{model_str(source.id)}", data=patch
            )
            return entity(**res)

        except Exception as exc:
            logger.debug(traceback.format_exc())
            logger.error(
                f"Error trying to PATCH description for {entity.__class__.__name__} [{source.id}]: {exc}"
            )

        return None

    def patch_description(
        self,
        entity: Type[T],
        source: T,
        description: str,
        force: bool = False,
    ) -> Optional[T]:
        """
        Given an Entity type and ID, JSON PATCH the description.

        Args
            entity (T): Entity Type
            source: source entity object
            description: new description to add
            force: if True, we will patch any existing description. Otherwise, we will maintain
                the existing data.
        Returns
            Updated Entity
        """
        instance = self._fetch_entity_if_exists(entity=entity, entity_id=source.id)
        if not instance:
            return None

        if instance.description and not force:
            logger.warning(
                f"The entity with id [{model_str(source.id)}] already has a description."
                " To overwrite it, set `force` to True."
            )
            return None
        destination = source
        destination.description = description
        return self.patch(entity, source, destination)

    def patch_table_constraints(
        self,
        source_table: Table,
        table_constraints: List[TableConstraint],
    ) -> Optional[T]:
        """Given an Entity ID, JSON PATCH the table constraints of table

        Args
            source_table: Origin table
            description: new description to add
            table_constraints: table constraints to add

        Returns
            Updated Entity
        """
        table: Table = self._fetch_entity_if_exists(
            entity=Table,
            entity_id=source_table.id,
        )

        if not table:
            return None

        dest_table = source_table
        dest_table.tableConstraints = table_constraints
        self.patch(self, Table, source_table, dest_table)

    def patch_tag(
        self,
        entity: Type[T],
        source: T,
        tag_label: TagLabel,
        operation: Union[
            PatchOperation.ADD, PatchOperation.REMOVE
        ] = PatchOperation.ADD,
    ) -> Optional[T]:
        """
        Given an Entity type and ID, JSON PATCH the tag.

        Args
            entity (T): Entity Type
            source: Source entity object
            tag_label: TagLabel to add or remove
            operation: Patch Operation to add or remove the tag.
        Returns
            Updated Entity
        """
        instance = self._fetch_entity_if_exists(entity=entity, entity_id=source.id)
        if not instance:
            return None

        destination = source
        if operation == PatchOperation.REMOVE:
            for tag in destination.tags:
                if tag.tagFQN == tag_label.tagFQN:
                    destination.tags.remove(tag)
        else:
            destination.tags.append(tag_label)

        return self.patch(Table, source, destination)

    def patch_owner(
        self,
        entity: Type[T],
        source: T,
        owner: EntityReference = None,
        force: bool = False,
    ) -> Optional[T]:
        """
        Given an Entity type and ID, JSON PATCH the owner. If not owner Entity type and
        not owner ID are provided, the owner is removed.

        Args
            entity (T): Entity Type of the entity to be patched
            entity_id: ID of the entity to be patched
            owner: Entity Reference of the owner. If None, the owner will be removed
            force: if True, we will patch any existing owner. Otherwise, we will maintain
                the existing data.
        Returns
            Updated Entity
        """
        instance = self._fetch_entity_if_exists(entity=entity, entity_id=source.id)

        if not instance:
            return None

        # Don't change existing data without force
        if instance.owner and not force:
            logger.warning(
                f"The entity with id [{model_str(entity.id)}] already has an owner."
                " To overwrite it, set `overrideOwner` to True."
            )
            return None

        destination = source
        destination.owner = owner
        return self.patch(entity, source, destination)

    def patch_column_tag(
        self,
        src_table: Table,
        column_fqn: str,
        tag_label: TagLabel,
        operation: Union[
            PatchOperation.ADD, PatchOperation.REMOVE
        ] = PatchOperation.ADD,
    ) -> Optional[T]:
        """Given an Entity ID, JSON PATCH the tag of the column

        Args
            entity_id: ID
            tag_label: TagLabel to add or remove
            column_name: column to update
            operation: Patch Operation to add or remove
        Returns
            Updated Entity
        """
        table_exists: Table = self._fetch_entity_if_exists(
            entity=Table, entity_id=src_table.id
        )

        if not table_exists:
            return None

        dest_table = src_table
        update_column_tags(dest_table.columns, column_fqn, tag_label, operation)

        patch = jsonpatch.make_patch(src_table.json(), dest_table.json())
        if patch is None:
            logger.warning(f"Cannot find column {column_fqn} in Table.")
            return None

        return self.patch(Table, src_table, dest_table)

    def patch_column_description(
        self,
        src_table: Table,
        column_fqn: str,
        description: str,
        force: bool = False,
    ) -> Optional[T]:
        """Given an Table , Column FQN, JSON PATCH the description of the column

        Args
            src_table: origin Table object
            column_fqn: FQN of the column to update
            description: new description to add
            force: if True, we will patch any existing description. Otherwise, we will maintain
                the existing data.
        Returns
            Updated Entity
        """
        table: Table = self._fetch_entity_if_exists(
            entity=Table,
            entity_id=src_table.id,
        )

        if not table or not table.columns:
            return None

        dest_table = src_table
        update_column_description(dest_table.columns, column_fqn, description, force)

        patch = jsonpatch.make_patch(src_table.json(), dest_table.json())
        if patch is None:
            logger.warning(f"Cannot find column {column_fqn} in Table.")
            return None

        return self.patch(Table, src_table, dest_table)

    def patch_automation_workflow_response(
        self,
        automation_workflow: AutomationWorkflow,
        test_connection_result: TestConnectionResult,
        workflow_status: WorkflowStatus,
    ) -> None:
        """
        Given an AutomationWorkflow, JSON PATCH the status and response.
        """
        result_data: Dict = {
            PatchField.PATH: PatchPath.RESPONSE,
            PatchField.VALUE: test_connection_result.dict(),
            PatchField.OPERATION: PatchOperation.ADD,
        }

        # for deserializing into json convert enum object to string
        result_data[PatchField.VALUE]["status"] = result_data[PatchField.VALUE][
            "status"
        ].value

        status_data: Dict = {
            PatchField.PATH: PatchPath.STATUS,
            PatchField.OPERATION: PatchOperation.ADD,
            PatchField.VALUE: workflow_status.value,
        }

        try:
            self.client.patch(
                path=f"{self.get_suffix(AutomationWorkflow)}/{model_str(automation_workflow.id)}",
                data=json.dumps([result_data, status_data]),
            )
        except Exception as exc:
            logger.debug(traceback.format_exc())
            logger.error(
                f"Error trying to PATCH status for automation workflow [{model_str(automation_workflow)}]: {exc}"
            )
