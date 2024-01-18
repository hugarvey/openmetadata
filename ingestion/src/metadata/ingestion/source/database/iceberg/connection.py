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
Source connection handler
"""

from typing import Optional

from pyiceberg.catalog import Catalog, load_catalog

from metadata.generated.schema.entity.automations.workflow import (
    Workflow as AutomationWorkflow,
)
from metadata.generated.schema.entity.services.connections.database.icebergConnection import (
    IcebergConnection,
)
from metadata.ingestion.connections.test_connections import test_connection_steps
from metadata.ingestion.ometa.ometa_api import OpenMetadata


def get_connection(connection: IcebergConnection) -> Catalog:
    """
    Create connection
    """
    return load_catalog(
        connection.catalog.catalog_name, **connection.catalog.catalog_config.dict()
    )


def test_connection(
    metadata: OpenMetadata,
    catalog: Catalog,
    service_connection: IcebergConnection,
    automation_workflow: Optional[AutomationWorkflow] = None,
) -> None:
    """
    Test connection. This can be executed either as part
    of a metadata workflow or during an Automation Workflow
    """

    def custom_executor_for_namespaces():
        list(catalog.list_namespaces())

    def custom_executor_for_tables():
        for namespace in catalog.list_namespaces():
            return list(catalog.list_tables(namespace))

    test_fn = {
        "GetNamespaces": custom_executor_for_namespaces,
        "GetTables": custom_executor_for_tables,
    }

    test_connection_steps(
        metadata=metadata,
        test_fn=test_fn,
        service_type=service_connection.type.value,
        automation_workflow=automation_workflow,
    )
