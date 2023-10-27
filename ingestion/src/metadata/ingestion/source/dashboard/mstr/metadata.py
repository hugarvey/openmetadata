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
"""Mstr source module"""
import traceback
from typing import Iterable, List, Optional

from metadata.generated.schema.api.data.createChart import CreateChartRequest
from metadata.generated.schema.api.data.createDashboard import CreateDashboardRequest
from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.entity.data.chart import Chart
from metadata.generated.schema.entity.services.connections.dashboard.mstrConnection import (
    MstrConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.source import InvalidSourceException
from metadata.ingestion.source.dashboard.dashboard_service import DashboardServiceSource
from metadata.ingestion.source.dashboard.mstr.models import (
    MstrDashboard,
    MstrDashboardDetails,
)
from metadata.utils import fqn
from metadata.utils.filters import filter_by_chart
from metadata.utils.helpers import clean_uri, get_standard_chart_type
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class MstrSource(DashboardServiceSource):
    """
    MSTR Source Class
    """

    config: WorkflowSource
    metadata_config: OpenMetadataConnection

    @classmethod
    def create(cls, config_dict: dict, metadata_config: OpenMetadataConnection):
        config = WorkflowSource.parse_obj(config_dict)
        connection: MstrConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, MstrConnection):
            raise InvalidSourceException(
                f"Expected MstrConnection, but got {connection}"
            )
        return cls(config, metadata_config)

    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):
        super().__init__(config, metadata_config)

    def get_dashboards_list(self) -> Optional[List[MstrDashboard]]:
        """
        Get List of all dashboards
        """
        dashboards = []

        if self.client.is_project_name():
            project = self.client.get_project_by_name()
            dashboards.extend(self.client.get_dashboards_list(project.id, project.name))

        if not self.client.is_project_name():
            for project in self.client.get_projects_list():
                dashboards.extend(
                    self.client.get_dashboards_list(project.id, project.name)
                )

        return dashboards

    def get_dashboard_name(self, dashboard: MstrDashboard) -> str:
        """
        Get Dashboard Name
        """
        return dashboard.name

    def get_dashboard_details(self, dashboard: MstrDashboard) -> MstrDashboardDetails:
        """
        Get Dashboard Details
        """
        dashboard_details = self.client.get_dashboard_details(
            dashboard.projectId, dashboard.projectName, dashboard.id
        )
        return dashboard_details

    def yield_dashboard(
        self, dashboard_details: MstrDashboardDetails
    ) -> Iterable[CreateDashboardRequest]:
        """
        Method to Get Dashboard Entity
        """
        try:
            dashboard_url = (
                f"{clean_uri(self.service_connection.hostPort)}/MicroStrategyLibrary/app/"
                f"{dashboard_details.projectId}/{dashboard_details.id}"
            )
            dashboard_request = CreateDashboardRequest(
                name=dashboard_details.id,
                displayName=dashboard_details.name,
                sourceUrl=dashboard_url,
                project=dashboard_details.projectName,
                charts=[
                    fqn.build(
                        self.metadata,
                        entity_type=Chart,
                        service_name=self.context.dashboard_service.fullyQualifiedName.__root__,
                        chart_name=chart.name.__root__,
                    )
                    for chart in self.context.charts
                ],
                service=self.context.dashboard_service.fullyQualifiedName.__root__,
            )
            yield dashboard_request
            self.register_record(dashboard_request=dashboard_request)
        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error creating dashboard: {exc}")

    def yield_dashboard_lineage_details(
        self, dashboard_details: MstrDashboardDetails, db_service_name: str
    ) -> Optional[Iterable[AddLineageRequest]]:
        yield None

    def yield_dashboard_chart(
        self, dashboard_details: MstrDashboardDetails
    ) -> Optional[Iterable[CreateChartRequest]]:
        """Get chart method

        Args:
            dashboard_details:
        Returns:
            Iterable[CreateChartRequest]
        """
        try:
            chapters = dashboard_details.chapters
            for chapter in chapters:
                pages = chapter.pages
                for page in pages:
                    visualizations = page.visualizations
                    for chart in visualizations:
                        try:
                            if filter_by_chart(
                                self.source_config.chartFilterPattern, chart.name
                            ):
                                self.status.filter(
                                    chart.name, "Chart Pattern not allowed"
                                )
                                continue

                            yield CreateChartRequest(
                                name="{}{}".format(page.key, chart.key),
                                displayName=chart.name,
                                chartType=get_standard_chart_type(
                                    chart.visualizationType
                                ).value,
                                service=self.context.dashboard_service.fullyQualifiedName.__root__,
                            )
                            self.status.scanned(chart.name)
                        except Exception as exc:  # pylint: disable=broad-except
                            logger.debug(traceback.format_exc())
                            logger.warning(f"Error creating chart [{chart}]: {exc}")

        except Exception as exc:  # pylint: disable=broad-except
            logger.debug(traceback.format_exc())
            logger.warning(f"Error creating dashboard: {exc}")
