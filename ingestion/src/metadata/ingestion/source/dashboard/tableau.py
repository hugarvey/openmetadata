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
Tableau source module
"""
import traceback
import uuid
from typing import Iterable, List, Optional

import dateutil.parser as dateparser
from tableau_api_lib.utils.querying import (
    get_views_dataframe,
    get_workbook_connections_dataframe,
    get_workbooks_dataframe,
)

from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.entity.data.dashboard import (
    Dashboard as LineageDashboard,
)
from metadata.generated.schema.entity.data.table import Table
from metadata.generated.schema.entity.services.connections.dashboard.tableauConnection import (
    TableauConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.generated.schema.type.entityLineage import EntitiesEdge
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.api.source import InvalidSourceException, SourceStatus
from metadata.ingestion.models.table_metadata import Chart, Dashboard, DashboardOwner
from metadata.ingestion.source.dashboard.dashboard_source import DashboardSourceService
from metadata.utils import fqn
from metadata.utils.filters import filter_by_chart
from metadata.utils.fqn import FQN_SEPARATOR
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class TableauSource(DashboardSourceService):
    """Tableau source entity class

    Args:
        config:
        metadata_config:

    Attributes:
        config:
        metadata_config:
        all_dashboard_details:
    """

    config: WorkflowSource
    metadata_config: OpenMetadataConnection
    status: SourceStatus

    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):

        super().__init__(config, metadata_config)
        self.dashboards = get_workbooks_dataframe(self.client).to_dict()
        self.all_dashboard_details = get_views_dataframe(self.client).to_dict()

    @classmethod
    def create(cls, config_dict: dict, metadata_config: OpenMetadataConnection):
        config: WorkflowSource = WorkflowSource.parse_obj(config_dict)
        connection: TableauConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, TableauConnection):
            raise InvalidSourceException(
                f"Expected TableauConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    @staticmethod
    def get_owner(owner) -> List[DashboardOwner]:
        """Get dashboard owner

        Args:
            owner:
        Returns:
            List[DashboardOwner]
        """
        parts = owner["fullName"].split(" ")
        first_name = " ".join(parts[: len(owner) // 2])
        last_name = " ".join(parts[len(owner) // 2 :])
        return [
            DashboardOwner(
                first_name=first_name,
                last_name=last_name,
                username=owner["name"],
            )
        ]

    def get_dashboards_list(self) -> Optional[List[dict]]:
        """
        Get List of all dashboards
        """
        dashboards = [{} for _ in range(len(self.dashboards["id"]))]
        for key, obj_dicts in self.dashboards.items():
            for index, value in obj_dicts.items():
                dashboards[int(index)][key] = value
        return dashboards

    def get_dashboard_name(self, dashboard_details: dict) -> str:
        """
        Get Dashboard Name
        """
        return dashboard_details.get("name")

    def get_dashboard_details(self, dashboard: dict) -> dict:
        """
        Get Dashboard Details
        """
        return dashboard

    def get_dashboard_entity(self, dashboard_details: dict) -> Dashboard:
        """
        Method to Get Dashboard Entity
        """
        yield from self.fetch_dashboard_charts(dashboard_details)
        dashboard_tag = dashboard_details.get("tags")
        tag_labels = []
        if hasattr(dashboard_tag, "tag"):
            tag_labels = [tag["label"] for tag in dashboard_tag["tag"]]
        yield Dashboard(
            id=uuid.uuid4(),
            name=dashboard_details.get("name"),
            displayName=dashboard_details.get("name"),
            description="",
            owner=self.get_owner(self.owner),
            charts=self.charts,
            tags=tag_labels,
            url=dashboard_details.get("webpageUrl"),
            service=EntityReference(id=self.service.id, type="dashboardService"),
            last_modified=dateparser.parse(self.chart["updatedAt"]).timestamp() * 1000,
        )

    def get_lineage(self, dashboard_details: dict) -> Optional[AddLineageRequest]:
        """
        Get lineage between dashboard and data sources
        """
        datasource_list = (
            get_workbook_connections_dataframe(self.client, dashboard_details.get("id"))
            .get("datasource_name")
            .tolist()
        )
        dashboard_name = dashboard_details.get("name")
        for datasource in datasource_list:
            try:
                schema_and_table_name = (
                    datasource.split("(")[1].split(")")[0].split(".")
                )
                schema_name = schema_and_table_name[0]
                table_name = schema_and_table_name[1]
                from_fqn = fqn.build(
                    self.metadata,
                    entity_type=Table,
                    service_name=self.source_config.dbServiceName,
                    schema_name=schema_name,
                    table_name=table_name,
                    database_name=None,
                )
                from_entity = self.metadata.get_by_name(
                    entity=Table,
                    fqn=from_fqn,
                )
                to_fqn = fqn.build(
                    self.metadata,
                    entity_type=LineageDashboard,
                    service_name=self.config.serviceName,
                    dashboard_name=dashboard_name,
                )
                to_entity = self.metadata.get_by_name(
                    entity=LineageDashboard,
                    fqn=to_fqn,
                )
                if from_entity and to_entity:
                    lineage = AddLineageRequest(
                        edge=EntitiesEdge(
                            fromEntity=EntityReference(
                                id=from_entity.id.__root__, type="table"
                            ),
                            toEntity=EntityReference(
                                id=to_entity.id.__root__, type="dashboard"
                            ),
                        )
                    )
                    yield lineage
            except (Exception, IndexError) as err:
                logger.debug(traceback.format_exc())
                logger.error(err)

    def fetch_dashboard_charts(
        self, dashboard_details: dict
    ) -> Optional[Iterable[Chart]]:
        """
        Method to fetch charts linked to dashboard
        """
        self.charts = []
        self.chart = None
        self.owner = None
        for index in range(len(self.all_dashboard_details["id"])):
            try:
                self.owner = self.all_dashboard_details["owner"][index]
                self.chart = self.all_dashboard_details["workbook"][index]
                if self.chart["id"] == dashboard_details.get("id"):
                    chart_id = self.all_dashboard_details["id"][index]
                    chart_name = self.all_dashboard_details["name"][index]
                    if filter_by_chart(
                        self.source_config.chartFilterPattern, chart_name
                    ):
                        self.status.failure(chart_name, "Chart Pattern not allowed")
                        continue
                    chart_tags = self.all_dashboard_details["tags"][index]
                    chart_url = (
                        f"{self.service_connection.hostPort}"
                        f"/#/site/{self.service_connection.siteName}/"
                        f"views/{self.all_dashboard_details['workbook'][index]['name']}/"
                        f"{self.all_dashboard_details['viewUrlName'][index]}"
                    )
                    chart_last_modified = self.all_dashboard_details["updatedAt"][index]
                    tag_labels = []
                    if hasattr(chart_tags, "tag"):
                        for tag in chart_tags["tag"]:
                            tag_labels.append(tag["label"])
                    yield Chart(
                        id=uuid.uuid4(),
                        name=chart_id,
                        displayName=chart_name,
                        description="",
                        chart_type=self.all_dashboard_details["sheetType"][index],
                        url=chart_url,
                        owners=self.get_owner(
                            self.all_dashboard_details["owner"][index]
                        ),
                        datasource_fqn=chart_url.replace("/", FQN_SEPARATOR),
                        last_modified=dateparser.parse(chart_last_modified).timestamp()
                        * 1000,
                        service=EntityReference(
                            id=self.service.id, type="dashboardService"
                        ),
                    )
                    self.charts.append(chart_id)
                    self.status.scanned(chart_id)
            except Exception as err:
                logger.debug(traceback.format_exc())
                logger.error(err)
