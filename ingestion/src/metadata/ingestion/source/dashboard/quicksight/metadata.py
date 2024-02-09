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
"""QuickSight source module"""

import traceback
from typing import Any, Iterable, List, Optional

from pydantic import ValidationError

from metadata.generated.schema.api.data.createChart import CreateChartRequest
from metadata.generated.schema.api.data.createDashboard import CreateDashboardRequest
from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.entity.data.chart import Chart, ChartType
from metadata.generated.schema.entity.data.dashboard import Dashboard
from metadata.generated.schema.entity.data.table import Table
from metadata.generated.schema.entity.services.connections.dashboard.quickSightConnection import (
    QuickSightConnection,
)
from metadata.generated.schema.entity.services.ingestionPipelines.status import (
    StackTraceError,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.models import Either
from metadata.ingestion.api.steps import InvalidSourceException
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.dashboard.dashboard_service import DashboardServiceSource
from metadata.ingestion.source.dashboard.quicksight.models import DataSourceResp
from metadata.utils import fqn
from metadata.utils.filters import filter_by_chart
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()

# BoundLimit for MaxResults = MaxResults >= 0 and MaxResults <= 100
QUICKSIGHT_MAX_RESULTS = 100


class QuicksightSource(DashboardServiceSource):
    """
    QuickSight Source Class
    """

    config: WorkflowSource
    metadata: OpenMetadata

    def __init__(self, config: WorkflowSource, metadata: OpenMetadata):
        super().__init__(config, metadata)
        self.aws_account_id = self.service_connection.awsAccountId
        self.dashboard_url = None
        self.aws_region = (
            self.config.serviceConnection.__root__.config.awsConfig.awsRegion
        )
        self.default_args = {
            "AwsAccountId": self.aws_account_id,
            "MaxResults": QUICKSIGHT_MAX_RESULTS,
        }

    @classmethod
    def create(cls, config_dict, metadata: OpenMetadata):
        config = WorkflowSource.parse_obj(config_dict)
        connection: QuickSightConnection = config.serviceConnection.__root__.config
        if not isinstance(connection, QuickSightConnection):
            raise InvalidSourceException(
                f"Expected QuickSightConnection, but got {connection}"
            )
        return cls(config, metadata)

    def _check_pagination(self, listing_method, entity_key) -> Optional[List]:
        entity_summary_list = []
        entity_response = listing_method(self.default_args)
        entity_summary_list.extend(entity_response[entity_key])
        while entity_response.get("NextToken"):
            try:
                copied_def_args = self.default_args.copy()
                copied_def_args.update({"NextToken": entity_response.get("NextToken")})
                entity_response = listing_method(copied_def_args)
                entity_summary_list.extend(entity_response[entity_key])
            except Exception as err:
                logger.error(f"Pagination Failed with error: {err}")
                logger.debug(traceback.format_exc())
                break
        return entity_summary_list

    def get_dashboards_list(self) -> Optional[List[dict]]:
        """
        Get List of all dashboards
        """
        list_dashboards_func = lambda kwargs: self.client.list_dashboards(  # pylint: disable=unnecessary-lambda-assignment
            **kwargs
        )

        dashboard_summary_list = self._check_pagination(
            listing_method=list_dashboards_func,
            entity_key="DashboardSummaryList",
        )
        dashboard_set = {
            dashboard["DashboardId"] for dashboard in dashboard_summary_list
        }
        dashboards = [
            self.client.describe_dashboard(
                AwsAccountId=self.aws_account_id, DashboardId=dashboard_id
            )["Dashboard"]
            for dashboard_id in dashboard_set
        ]
        return dashboards

    def get_dashboard_name(self, dashboard: dict) -> str:
        """
        Get Dashboard Name
        """
        return dashboard["Name"]

    def get_dashboard_details(self, dashboard: dict) -> dict:
        """
        Get Dashboard Details
        """
        return dashboard

    def yield_dashboard(
        self, dashboard_details: dict
    ) -> Iterable[Either[CreateDashboardRequest]]:
        """
        Method to Get Dashboard Entity
        """
        dashboard_request = CreateDashboardRequest(
            name=dashboard_details["DashboardId"],
            sourceUrl=self.dashboard_url,
            displayName=dashboard_details["Name"],
            description=dashboard_details["Version"].get("Description"),
            charts=[
                fqn.build(
                    self.metadata,
                    entity_type=Chart,
                    service_name=self.context.get().dashboard_service,
                    chart_name=chart,
                )
                for chart in self.context.get().charts or []
            ],
            service=self.context.get().dashboard_service,
            owner=self.get_owner_ref(dashboard_details=dashboard_details),
        )
        yield Either(right=dashboard_request)
        self.register_record(dashboard_request=dashboard_request)

    def yield_dashboard_chart(
        self, dashboard_details: Any
    ) -> Iterable[Either[CreateChartRequest]]:
        """Get chart method"""
        # Each dashboard is guaranteed to have at least one sheet, which represents
        # a chart in the context of QuickSight
        # https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/quicksight.html#QuickSight.Client.describe_dashboard
        charts = dashboard_details["Version"]["Sheets"]
        for chart in charts:
            try:
                if filter_by_chart(
                    self.source_config.chartFilterPattern, chart["Name"]
                ):
                    self.status.filter(chart["Name"], "Chart Pattern not allowed")
                    continue

                self.dashboard_url = (
                    f"https://{self.aws_region}.quicksight.aws.amazon.com/sn/dashboards"
                    f'/{dashboard_details.get("DashboardId")}'
                )
                yield Either(
                    right=CreateChartRequest(
                        name=chart["SheetId"],
                        displayName=chart["Name"],
                        chartType=ChartType.Other.value,
                        sourceUrl=self.dashboard_url,
                        service=self.context.get().dashboard_service,
                    )
                )
            except Exception as exc:
                yield Either(
                    left=StackTraceError(
                        name="Chart",
                        error=f"Error creating chart [{chart}]: {exc}",
                        stackTrace=traceback.format_exc(),
                    )
                )

    def yield_dashboard_lineage_details(  # pylint: disable=too-many-locals
        self, dashboard_details: dict, db_service_name: str
    ) -> Iterable[Either[AddLineageRequest]]:
        """
        Get lineage between dashboard and data sources
        """
        try:
            list_data_set_func = lambda kwargs: self.client.list_data_sets(  # pylint: disable=unnecessary-lambda-assignment
                **kwargs
            )
            data_set_summary_list = self._check_pagination(
                listing_method=list_data_set_func,
                entity_key="DataSetSummaries",
            )
            dataset_ids = {
                dataset["DataSetId"]
                for dataset in data_set_summary_list
                if dataset.get("Arn") in dashboard_details["Version"]["DataSetArns"]
            }

            for dataset_id in dataset_ids:
                for data_source in list(
                    self.client.describe_data_set(
                        AwsAccountId=self.aws_account_id, DataSetId=dataset_id
                    )["DataSet"]["PhysicalTableMap"].values()
                ):
                    try:
                        if not data_source.get("RelationalTable"):
                            raise KeyError(
                                f"We currently don't support lineage to {list(data_source.keys())}"
                            )
                        data_source_relational_table = data_source["RelationalTable"]
                        data_source_resp = DataSourceResp(
                            datasource_arn=data_source_relational_table[
                                "DataSourceArn"
                            ],
                            schema_name=data_source_relational_table["Schema"],
                            table_name=data_source_relational_table["Name"],
                        )
                    except (KeyError, ValidationError) as err:
                        yield Either(
                            left=StackTraceError(
                                name="Lineage",
                                error=(
                                    "Error to yield dashboard lineage details for DB service"
                                    f" name [{db_service_name}]: {err}"
                                ),
                                stackTrace=traceback.format_exc(),
                            )
                        )

                    schema_name = data_source_resp.schema_name
                    table_name = data_source_resp.table_name

                    list_data_source_func = lambda kwargs: self.client.list_data_sources(  # pylint: disable=unnecessary-lambda-assignment
                        **kwargs
                    )

                    data_source_summary_list = self._check_pagination(
                        listing_method=list_data_source_func,
                        entity_key="DataSources",
                    )

                    data_source_ids = [
                        data_source_arn["DataSourceId"]
                        for data_source_arn in data_source_summary_list
                        if data_source_arn["Arn"] in data_source_resp.datasource_arn
                    ]

                    for data_source_id in data_source_ids:
                        data_source_dict = self.client.describe_data_source(
                            AwsAccountId=self.aws_account_id,
                            DataSourceId=data_source_id,
                        )["DataSource"]["DataSourceParameters"]
                        for db in data_source_dict.keys():
                            from_fqn = fqn.build(
                                self.metadata,
                                entity_type=Table,
                                service_name=db_service_name,
                                database_name=data_source_dict[db]["Database"],
                                schema_name=schema_name,
                                table_name=table_name,
                                skip_es_search=True,
                            )
                            from_entity = self.metadata.get_by_name(
                                entity=Table,
                                fqn=from_fqn,
                            )
                            to_fqn = fqn.build(
                                self.metadata,
                                entity_type=Dashboard,
                                service_name=self.config.serviceName,
                                dashboard_name=dashboard_details["DashboardId"],
                            )
                            to_entity = self.metadata.get_by_name(
                                entity=Dashboard,
                                fqn=to_fqn,
                            )
                            yield self._get_add_lineage_request(
                                to_entity=to_entity, from_entity=from_entity
                            )
        except Exception as exc:  # pylint: disable=broad-except
            yield Either(
                left=StackTraceError(
                    name="Lineage",
                    error=f"Error to yield dashboard lineage details for DB service name [{db_service_name}]: {exc}",
                    stackTrace=traceback.format_exc(),
                )
            )
