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
Base class for ingesting mlmodel services
"""
from abc import ABC, abstractmethod
from typing import Any, Iterable, List, Optional, Set

from metadata.generated.schema.api.data.createMlModel import CreateMlModelRequest
from metadata.generated.schema.entity.data.mlmodel import (
    MlFeature,
    MlHyperParameter,
    MlModel,
    MlStore,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.entity.services.mlmodelService import (
    MlModelConnection,
    MlModelService,
)
from metadata.generated.schema.metadataIngestion.mlmodelServiceMetadataPipeline import (
    MlModelServiceMetadataPipeline,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.delete import delete_entity_from_source
from metadata.ingestion.api.steps import Source
from metadata.ingestion.api.topology_runner import TopologyRunnerMixin
from metadata.ingestion.models.delete_entity import DeleteEntity
from metadata.ingestion.models.topology import (
    NodeStage,
    ServiceTopology,
    TopologyNode,
    create_source_context,
)
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.connections import get_connection, get_test_connection_fn
from metadata.utils import fqn
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class MlModelServiceTopology(ServiceTopology):
    """
    Defines the hierarchy in MlModel Services.
    service -> MlModel

    We could have a topology validator. We can only consume
    data that has been produced by any parent node.
    """

    root = TopologyNode(
        producer="get_services",
        stages=[
            NodeStage(
                type_=MlModelService,
                context="mlmodel_service",
                processor="yield_create_request_mlmodel_service",
                overwrite=False,
                must_return=True,
            ),
        ],
        children=["mlmodel"],
        post_process=["mark_mlmodels_as_deleted"],
    )
    mlmodel = TopologyNode(
        producer="get_mlmodels",
        stages=[
            NodeStage(
                type_=MlModel,
                context="mlmodels",
                processor="yield_mlmodel",
                consumer=["mlmodel_service"],
            ),
        ],
    )


class MlModelServiceSource(TopologyRunnerMixin, Source, ABC):
    """
    Base class for MlModel services.
    It implements the topology and context
    """

    source_config: MlModelServiceMetadataPipeline
    config: WorkflowSource
    # Big union of types we want to fetch dynamically
    service_connection: MlModelConnection.__fields__["config"].type_

    topology = MlModelServiceTopology()
    context = create_source_context(topology)
    mlmodel_source_state: Set = set()

    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):
        super().__init__()
        self.config = config
        self.metadata_config = metadata_config
        self.metadata = OpenMetadata(metadata_config)
        self.service_connection = self.config.serviceConnection.__root__.config
        self.source_config: MlModelServiceMetadataPipeline = (
            self.config.sourceConfig.config
        )
        self.connection = get_connection(self.service_connection)

        # Flag the connection for the test connection
        self.connection_obj = self.connection
        self.test_connection()

        self.client = self.connection

    def get_services(self) -> Iterable[WorkflowSource]:
        yield self.config

    def yield_create_request_mlmodel_service(self, config: WorkflowSource):
        yield self.metadata.get_create_service_from_source(
            entity=MlModelService, config=config
        )

    @abstractmethod
    def get_mlmodels(self, *args, **kwargs) -> Iterable[Any]:
        """
        Method to list all models to process.
        Here is where filtering happens
        """

    @abstractmethod
    def yield_mlmodel(self, *args, **kwargs) -> Iterable[CreateMlModelRequest]:
        """
        Method to return MlModel Entities
        """

    @abstractmethod
    def _get_hyper_params(self, *args, **kwargs) -> Optional[List[MlHyperParameter]]:
        """
        Get the Hyper Parameters from the MlModel
        """

    @abstractmethod
    def _get_ml_store(self, *args, **kwargs) -> Optional[MlStore]:
        """
        Get the Ml Store from the model version object
        """

    @abstractmethod
    def _get_ml_features(self, *args, **kwargs) -> Optional[List[MlFeature]]:
        """
        Pick up features
        """

    @abstractmethod
    def _get_algorithm(self, *args, **kwargs) -> str:
        """
        Return the algorithm for a given model
        """

    def close(self):
        pass

    def test_connection(self) -> None:
        test_connection_fn = get_test_connection_fn(self.service_connection)
        test_connection_fn(self.metadata, self.connection_obj, self.service_connection)

    def mark_mlmodels_as_deleted(self) -> Iterable[Either[DeleteEntity]]:
        """
        Method to mark the mlmodels as deleted
        """
        if self.source_config.markDeletedMlModels:
            yield from delete_entity_from_source(
                metadata=self.metadata,
                entity_type=MlModel,
                entity_source_state=self.mlmodel_source_state,
                mark_deleted_entity=self.source_config.markDeletedMlModels,
                params={
                    "service": self.context.mlmodel_service.fullyQualifiedName.__root__
                },
            )

    def register_record(self, mlmodel_request: CreateMlModelRequest) -> None:
        """
        Mark the mlmodel record as scanned and update the mlmodel_source_state
        """
        mlmodel_fqn = fqn.build(
            self.metadata,
            entity_type=MlModel,
            service_name=mlmodel_request.service.__root__,
            mlmodel_name=mlmodel_request.name.__root__,
        )

        self.mlmodel_source_state.add(mlmodel_fqn)
        self.status.scanned(mlmodel_fqn)

    def prepare(self):
        pass
