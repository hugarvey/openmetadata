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
SAP Hana lineage module
"""
from metadata.generated.schema.entity.data.table import Table

from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.utils import fqn
from pydantic import Field, computed_field
from typing_extensions import Annotated

from metadata.ingestion.models.custom_pydantic import BaseModel


SYS_BIC_SCHEMA_NAME = "_SYS_BIC"


class SapHanaLineageModel(BaseModel):
    """SAP Hana Lineage model from _SYS_REPO.ACTIVE_OBJECT"""
    package_id: Annotated[str, Field(..., description="Package ID that hosts the model code")]
    object_name: Annotated[str, Field(..., description="View Name")]
    cdata: Annotated[str, Field(..., description="XML representation of the model")]

    @computed_field
    @property
    def name(self) -> str:
        """
        Actual name representation of the view in _SYS_BIC.VIEWS.
        This is the name in OpenMetadata
        """
        return f"{self.package_id}/{self.object_name}"

    def get_fqn(self, metadata: OpenMetadata, service_name: str) -> str:
        """Build OM's FQN with the static schema name from _SYS_BIC"""
        return fqn.build(
            metadata,
            entity_type=Table,
            service_name=service_name,
            database_name=None,
            schema_name=SYS_BIC_SCHEMA_NAME,
            table_name=self.name,
        )
