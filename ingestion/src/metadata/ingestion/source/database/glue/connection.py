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

from metadata.generated.schema.entity.automations.workflow import (
    Workflow as AutomationWorkflow,
)
from metadata.generated.schema.entity.services.connections.database.glueConnection import (
    GlueConnection,
)
from sqlalchemy.engine import Engine

from metadata.clients.aws_client import AWSClient
from metadata.ingestion.connections.test_connections import test_connection_steps
from metadata.ingestion.ometa.ometa_api import OpenMetadata


def get_connection(connection: GlueConnection) -> Engine:
    """
    Create connection
    """
    return AWSClient(connection.awsConfig).get_glue_client()


def test_connection(
    metadata: OpenMetadata,
    client: AWSClient,
    service_connection: GlueConnection,
    automation_workflow: Optional[AutomationWorkflow] = None,
) -> None:
    """
    Test connection. This can be executed either as part
    of a metadata workflow or during an Automation Workflow
    """

    def custom_executor_for_database():
        paginator = client.get_paginator("get_databases")
        list(paginator.paginate())

    def custom_executor_for_table():
        paginator = client.get_paginator("get_databases")
        for page in paginator.paginate():
            for schema in page["DatabaseList"]:
                database_name = schema["Name"]
                paginator = client.get_paginator("get_tables")
                tables = paginator.paginate(DatabaseName=database_name)
                return list(tables)
        return None

    test_fn = {
        "GetDatabases": custom_executor_for_database,
        "GetTables": custom_executor_for_table,
    }

    test_connection_steps(
        metadata=metadata,
        test_fn=test_fn,
        service_fqn=service_connection.type.value,
        automation_workflow=automation_workflow,
    )
