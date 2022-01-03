"""
Mixin class containing entity versioning specific methods

To be used by OpenMetadata
"""

import logging
from typing import TypeVar, Generic, Union, Optional, Type, List

from pydantic import BaseModel
from requests.models import Response

from metadata.generated.schema.type import basic
from metadata.ingestion.ometa.client import REST, APIError
from metadata.generated.schema.type.entityHistory import EntityVersionHistory


T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class OMetaVersionMixin(Generic[T]):
    """
    OpenMetadata API methods related to entity versioning.

    To be inherited by OpenMetadata
    """

    client: REST

    def version_to_str(self, version: Union[str, float]):
        """convert float version to str

        Parameters
        ----------
        version : Union[str, float]
            the version number of the entity

        Returns
        -------
        str
            the string representation of the version
        """
        if isinstance(version, float):
            return str(version)

        return version


    def get_entity_version(
        self,
        entity: Type[T],
        entity_id: Union[str, basic.Uuid],
        version: Union[str, float],
        fields: Optional[List[str]] = None
    ) -> Optional[T]:
        """
        Get an entity at a specific version

        Parameters
        ----------
        entity: T
            the entity type
        entity_id: Union[str, basic.Uuid]
            the ID for a specific entity
        version: Union[str, float]
            the specific version of the entity
        fields: List
            List of fields to return
        """
        entity_id = self.uuid_to_str(entity_id)
        version = self.version_to_str(version)

        path = f"{entity_id}/versions/{version}"

        return self._get(entity=entity, path=path, fields=fields)


    def get_list_entity_versions(
        self,
        entity_id: Union[str, basic.Uuid],
        entity: Type[T],
    ) -> Union[Response, EntityVersionHistory]:
        """
        Retrieve the list of versions for a specific entity

        Parameters
        ----------
        entity: T
            the entity type
        entity_id: Union[str, basic.Uuid]
            the ID for a specific entity

        Returns
        -------
        List
            lists of available versions for a specific entity
        """
        suffix = self.get_suffix(entity)
        path = f"{entity_id}/versions"

        resp = self.client.get(f"{self.get_suffix(entity)}/{path}")

        if self.__use_raw_data:
            return resp

        return EntityVersionHistory(**resp)
