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
OpenMetadata Airflow Lineage Backend
"""

import ast
import json
import os
import traceback
from typing import TYPE_CHECKING, Any, Callable, Dict, List, Optional, Set, Union

from airflow.configuration import conf
from airflow.lineage.backend import LineageBackend

from metadata.config.common import ConfigModel
from metadata.generated.schema.api.data.createPipeline import (
    CreatePipelineEntityRequest,
)
from metadata.generated.schema.api.lineage.addLineage import AddLineage
from metadata.generated.schema.api.services.createPipelineService import (
    CreatePipelineServiceEntityRequest,
)
from metadata.generated.schema.entity.data.pipeline import Pipeline, Task
from metadata.generated.schema.entity.data.table import Table
from metadata.generated.schema.entity.services.pipelineService import (
    PipelineService,
    PipelineServiceType,
)
from metadata.generated.schema.type.entityLineage import EntitiesEdge
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.ometa.openmetadata_rest import MetadataServerConfig
from metadata.utils.helpers import convert_epoch_to_iso

if TYPE_CHECKING:
    from airflow import DAG
    from airflow.models.baseoperator import BaseOperator

ALLOWED_TASK_KEYS = {
    "_downstream_task_ids",
    "_inlets",
    "_outlets",
    "_task_type",
    "_task_module",
    "depends_on_past",
    "email",
    "label",
    "execution_timeout",
    "end_date",
    "start_date",
    "sla",
    "sql",
    "task_id",
    "trigger_rule",
    "wait_for_downstream",
}

ALLOWED_FLOW_KEYS = {
    "_access_control",
    "_concurrency",
    "_default_view",
    "catchup",
    "fileloc",
    "is_paused_upon_creation",
    "start_date",
    "tags",
    "timezone",
}


class OpenMetadataLineageConfig(ConfigModel):
    airflow_service_name: str = "airflow"
    api_endpoint: str = "http://localhost:8585"
    auth_provider_type: str = "no-auth"
    secret_key: str = None


def get_lineage_config() -> OpenMetadataLineageConfig:
    """
    Load the lineage config from airflow_provider_openmetadata.cfg.
    """
    airflow_service_name = conf.get("lineage", "airflow_service_name", fallback=None)
    if airflow_service_name:
        api_endpoint = conf.get(
            "lineage", "openmetadata_api_endpoint", fallback="http://localhost:8585"
        )
        auth_provider_type = conf.get(
            "lineage", "auth_provider_type", fallback="no-auth"
        )
        secret_key = conf.get("lineage", "secret_key", fallback=None)
        return OpenMetadataLineageConfig.parse_obj(
            {
                "airflow_service_name": airflow_service_name,
                "api_endpoint": api_endpoint,
                "auth_provider_type": auth_provider_type,
                "secret_key": secret_key,
            }
        )

    openmetadata_config_file = os.getenv("OPENMETADATA_LINEAGE_CONFIG")
    if openmetadata_config_file:
        with open(openmetadata_config_file, encoding="utf-8") as config_file:
            config = json.load(config_file)
            return OpenMetadataLineageConfig.parse_obj(config)

    return OpenMetadataLineageConfig.parse_obj(
        {
            "airflow_service_name": "airflow",
            "api_endpoint": "http://localhost:8585/api",
            "auth_provider_type": "no-auth",
        }
    )


def get_properties(
    obj: Union["DAG", "BaseOperator"], serializer: Callable, allowed_keys: Set[str]
) -> Dict[str, str]:
    """
    Given either a DAG or a BaseOperator, obtain its allowed properties
    :param obj: DAG or BaseOperator object
    :return: properties dict
    """

    props: Dict[str, str] = {
        key: repr(value) for (key, value) in serializer(obj).items()
    }

    for key in obj.get_serialized_fields():
        if key not in props:
            props[key] = repr(getattr(obj, key))

    return {key: value for (key, value) in props.items() if key in allowed_keys}


def get_or_create_pipeline_service(
    operator: "BaseOperator", client: OpenMetadata, config: OpenMetadataLineageConfig
) -> PipelineService:
    """
    Check if we already have the airflow instance as a PipelineService,
    otherwise create it.

    :param operator: task from which we extract the lienage
    :param client: OpenMetadata API wrapper
    :param config: lineage config
    :return: PipelineService
    """
    operator.log.info("Get Airflow Service ID")
    airflow_service_entity = client.get_by_name(
        entity=PipelineService, fqdn=config.airflow_service_name
    )

    if airflow_service_entity is None:
        pipeline_service = CreatePipelineServiceEntityRequest(
            name=config.airflow_service_name,
            serviceType=PipelineServiceType.Airflow,
            pipelineUrl=conf.get("webserver", "base_url"),
        )
        airflow_service_entity = client.create_or_update(pipeline_service)
        operator.log.info("Created airflow service entity {}", airflow_service_entity)

    return airflow_service_entity


def create_pipeline_entity(
    dag_properties: Dict[str, str],
    task_properties: Dict[str, str],
    operator: "BaseOperator",
    dag: "DAG",
    airflow_service_entity: PipelineService,
    client: OpenMetadata,
) -> Pipeline:
    """
    Prepare the upsert the pipeline entity with the given task

    :param dag_properties: attributes of the dag object
    :param task_properties: attributes of the task object
    :param operator: task being examined by lineage
    :param dag: airflow dag
    :param airflow_service_entity: PipelineService
    :return: PipelineEntity
    """
    pipeline_service_url = conf.get("webserver", "base_url")
    dag_url = f"{pipeline_service_url}/tree?dag_id={dag.dag_id}"
    task_url = (
        f"{pipeline_service_url}/taskinstance/list/"
        + f"?flt1_dag_id_equals={dag.dag_id}&_flt_3_task_id={operator.task_id}"
    )
    dag_start_date = convert_epoch_to_iso(int(float(dag_properties["start_date"])))

    downstream_tasks = []
    if "_downstream_task_ids" in task_properties:
        downstream_tasks = ast.literal_eval(task_properties["_downstream_task_ids"])

    operator.log.info(f"downstream tasks {downstream_tasks}")

    task_start_date = (
        task_properties["start_date"].isoformat()
        if "start_time" in task_properties
        else None
    )
    task_end_date = (
        task_properties["end_date"].isoformat()
        if "end_time" in task_properties
        else None
    )

    task = Task(
        name=task_properties["task_id"],
        displayName=task_properties.get("label"),  # v1.10.15 does not have label
        taskUrl=task_url,
        taskType=task_properties["_task_type"],
        startDate=task_start_date,
        endDate=task_end_date,
        downstreamTasks=downstream_tasks,
    )
    create_pipeline = CreatePipelineEntityRequest(
        name=dag.dag_id,
        displayName=dag.dag_id,
        description=dag.description,
        pipelineUrl=dag_url,
        startDate=dag_start_date,
        tasks=[task],  # TODO: should we GET + append?
        service=EntityReference(id=airflow_service_entity.id, type="pipelineService"),
    )

    return client.create_or_update(create_pipeline)


def parse_lineage_to_openmetadata(
    config: OpenMetadataLineageConfig,
    context: Dict,
    operator: "BaseOperator",
    inlets: List,
    outlets: List,
    client: OpenMetadata,
) -> None:
    """
    Main logic to extract properties from DAG and the
    triggered operator to ingest lineage data into
    OpenMetadata

    :param config: lineage configuration
    :param context: airflow runtime context
    :param operator: task being executed
    :param inlets: list of upstream tables
    :param outlets: list of downstream tables
    :param client: OpenMetadata client
    """
    # Move this import to avoid circular import error when airflow parses the config
    # pylint: disable=import-outside-toplevel
    from airflow.serialization.serialized_objects import (
        SerializedBaseOperator,
        SerializedDAG,
    )

    operator.log.info("Parsing Lineage for OpenMetadata")
    dag: "DAG" = context["dag"]

    dag_properties = get_properties(dag, SerializedDAG.serialize_dag, ALLOWED_FLOW_KEYS)
    task_properties = get_properties(
        operator, SerializedBaseOperator.serialize_operator, ALLOWED_TASK_KEYS
    )

    operator.log.info(f"Task Properties {task_properties}")
    operator.log.info(f"DAG properties {dag_properties}")

    try:

        airflow_service_entity = get_or_create_pipeline_service(
            operator, client, config
        )
        pipeline = create_pipeline_entity(
            dag_properties,
            task_properties,
            operator,
            dag,
            airflow_service_entity,
            client,
        )

        operator.log.info("Parsing Lineage")
        for table in inlets if inlets else []:
            table_entity = client.get_by_name(entity=Table, fqdn=table)
            operator.log.debug(f"from entity {table_entity}")
            lineage = AddLineage(
                edge=EntitiesEdge(
                    fromEntity=EntityReference(id=table_entity.id, type="table"),
                    toEntity=EntityReference(id=pipeline.id, type="pipeline"),
                )
            )
            operator.log.debug(f"from lineage {lineage}")
            client.add_lineage(lineage)

        for table in outlets if outlets else []:
            table_entity = client.get_by_name(entity=Table, fqdn=table)
            operator.log.debug(f"to entity {table_entity}")
            lineage = AddLineage(
                edge=EntitiesEdge(
                    fromEntity=EntityReference(id=pipeline.id, type="pipeline"),
                    toEntity=EntityReference(id=table_entity.id, type="table"),
                )
            )
            operator.log.debug(f"to lineage {lineage}")
            client.add_lineage(lineage)

    except Exception as exc:  # pylint: disable=broad-except
        operator.log.error(
            f"Failed to parse Airflow DAG task and publish to OpenMetadata due to {exc}"
        )
        operator.log.error(traceback.format_exc())


def is_airflow_version_1() -> bool:
    """
    Check varying imports between Airflow v1 & v2
    """
    # pylint: disable=unused-import,import-outside-toplevel
    try:
        from airflow.hooks.base import BaseHook

        return False
    except ModuleNotFoundError:
        from airflow.hooks.base_hook import BaseHook

        return True


def get_xlets(
    operator: "BaseOperator", xlet: str = "_inlets"
) -> Union[Optional[List[str]], Any]:
    """
    Given an Airflow DAG Task, obtain the tables
    set in inlets or outlets.

    We expect xlets to have the following structure:
    [{'tables': ['FQDN']}]

    :param operator: task to get xlets from
    :param xlet: get inlet or outlet
    :return: list of tables FQDN
    """
    xlet = getattr(operator, xlet)
    if is_airflow_version_1():
        return xlet

    if len(xlet) and isinstance(xlet[0], dict):
        tables = xlet[0].get("tables")
        if isinstance(tables, list) and len(tables):
            return tables

    operator.log.info(f"Not finding proper {xlet} in task {operator.task_id}")
    return None


class OpenMetadataLineageBackend(LineageBackend):
    """
    Sends lineage data from tasks to OpenMetadata.

    Configurable via ``airflow_provider_openmetadata.cfg`` as follows: ::
    [lineage]
    backend = airflow_provider_openmetadata.lineage.OpenMetadataLineageBackend
    airflow_service_name = airflow #make sure this service_name matches
        the one configured in openMetadata
    openmetadata_api_endpoint = http://localhost:8585
    auth_provider_type = no-auth # use google here if you are
        configuring google as SSO
    secret_key = google-client-secret-key # it needs to be configured
        only if you are using google as SSO
    """

    def __init__(self) -> None:
        super().__init__()
        _ = get_lineage_config()

    @staticmethod
    def send_lineage(
        operator: "BaseOperator",
        inlets: Optional[List] = None,
        outlets: Optional[List] = None,
        context: Dict = None,
    ) -> None:

        try:
            config = get_lineage_config()
            metadata_config = MetadataServerConfig.parse_obj(
                {
                    "api_endpoint": config.api_endpoint,
                    "auth_provider_type": config.auth_provider_type,
                    "secret_key": config.secret_key,
                }
            )
            client = OpenMetadata(metadata_config)

            op_inlets = get_xlets(operator, "_inlets")
            op_outlets = get_xlets(operator, "_outlets")

            parse_lineage_to_openmetadata(
                config, context, operator, op_inlets, op_outlets, client
            )
        except Exception as exc:  # pylint: disable=broad-except
            operator.log.error(traceback.format_exc())
            operator.log.error(exc)
