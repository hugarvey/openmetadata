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
from typing import Iterable, Optional

from sqlalchemy import text

from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.entity.data.table import Table
from metadata.generated.schema.entity.services.connections.database.sapHanaConnection import (
    SapHanaConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.models import Either
from metadata.ingestion.api.steps import InvalidSourceException, Source
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.connections import get_test_connection_fn
from metadata.ingestion.source.database.saphana.cdata_parser import (
    ParsedLineage,
    parse_registry,
)
from metadata.ingestion.source.database.saphana.models import SapHanaLineageModel
from metadata.ingestion.source.database.saphana.queries import SAPHANA_LINEAGE
from metadata.utils.logger import ingestion_logger
from metadata.utils.ssl_manager import get_ssl_connection

logger = ingestion_logger()


class SaphanaLineageSource(Source):
    """
    Get the lineage information of:
    - calculationview
    - analyticview
    - attributeview

    We support the following relationships:
    - Analytic View and Attribute View based on a Table
    - Calculation View based on an Analytic View, Attribute View, Calculation View or Table

    Parse the CDATA XML definition from _SYS_REPO.ACTIVE_OBJECT
    """

    def __init__(
        self,
        config: WorkflowSource,
        metadata: OpenMetadata,
        get_engine: bool = True,
    ):
        super().__init__()
        self.config = config
        self.metadata = metadata
        self.service_connection = self.config.serviceConnection.root.config
        self.source_config = self.config.sourceConfig.config
        self.engine = (
            get_ssl_connection(self.service_connection) if get_engine else None
        )

        logger.info(
            "Initializing SAP Hana Lineage Source. Note that we'll parse the lineage from CDATA XML definition "
            + "from _SYS_REPO.ACTIVE_OBJECT and we won't use the time-specific input parameters."
        )

    def prepare(self):
        """By default, there's nothing to prepare"""

    @classmethod
    def create(
        cls, config_dict, metadata: OpenMetadata, pipeline_name: Optional[str] = None
    ):
        config: WorkflowSource = WorkflowSource.model_validate(config_dict)
        connection: SapHanaConnection = config.serviceConnection.root.config
        if not isinstance(connection, SapHanaConnection):
            raise InvalidSourceException(
                f"Expected SapHanaConnection, but got {connection}"
            )
        return cls(config, metadata)

    def close(self) -> None:
        self.engine.dispose()

    def _iter(self, *_, **__) -> Iterable[Either[AddLineageRequest]]:
        """
        Based on the query logs, prepare the lineage
        and send it to the sink
        """
        with self.engine.connect() as conn:
            result = conn.execution_options(
                stream_results=True, max_row_buffer=100
            ).execute(text(SAPHANA_LINEAGE))
            for row in result:
                lineage_model = SapHanaLineageModel.validate(dict(row))
                yield from self.parse_cdata(
                    metadata=self.metadata, lineage_model=lineage_model
                )

    def parse_cdata(
        self, metadata: OpenMetadata, lineage_model: SapHanaLineageModel
    ) -> Iterable[Either[AddLineageRequest]]:
        """Parse the CDATA XML definition from _SYS_REPO.ACTIVE_OBJECT"""
        parse_fn = parse_registry.registry.get(lineage_model.object_suffix.value)
        try:
            parsed_lineage: ParsedLineage = parse_fn(lineage_model.cdata)
            to_entity = metadata.get_entity_reference(
                entity=Table,
                fqn=lineage_model.get_fqn(
                    metadata=metadata,
                    service_name=self.config.serviceName,
                ),
            )

            if to_entity:
                yield from parsed_lineage.to_request(
                    metadata=metadata,
                    service_name=self.config.serviceName,
                    to_entity=to_entity,
                )
        except Exception as exc:
            logger.warning(
                f"Error parsing CDATA XML for {lineage_model.object_suffix} at "
                f"{lineage_model.package_id}/{lineage_model.object_name}",
                exc,
            )

    def test_connection(self) -> None:
        test_connection_fn = get_test_connection_fn(self.service_connection)
        test_connection_fn(self.engine)
