import types
from unittest import TestCase
from unittest.mock import patch

from sqlalchemy.types import VARCHAR

from ingestion.src.metadata.ingestion.source.database.postgres import (
    GEOMETRY,
    POINT,
    POLYGON,
)
from metadata.generated.schema.entity.data.database import Database
from metadata.generated.schema.entity.data.databaseSchema import DatabaseSchema
from metadata.generated.schema.entity.data.table import Column, Constraint, DataType
from metadata.generated.schema.entity.services.databaseService import (
    DatabaseConnection,
    DatabaseService,
    DatabaseServiceType,
)
from metadata.generated.schema.metadataIngestion.workflow import (
    OpenMetadataWorkflowConfig,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.source.database.postgres import PostgresSource

mock_postgres_config = {
    "source": {
        "type": "postgres",
        "serviceName": "local_postgres1",
        "serviceConnection": {
            "config": {
                "type": "Postgres",
                "username": "postgres",
                "password": "abcd1234",
                "hostPort": "localhost:5432",
                "database": "postgres",
            }
        },
        "sourceConfig": {
            "config": {
                "type": "DatabaseMetadata",
            }
        },
    },
    "sink": {
        "type": "metadata-rest",
        "config": {},
    },
    "workflowConfig": {
        "openMetadataServerConfig": {
            "hostPort": "http://localhost:8585/api",
            "authProvider": "no-auth",
        }
    },
}
MOCK_DATABASE_SERVICE = DatabaseService(
    id="85811038-099a-11ed-861d-0242ac120002",
    name="postgres_source",
    connection=DatabaseConnection(),
    serviceType=DatabaseServiceType.Postgres,
)

MOCK_DATABASE = Database(
    id="2aaa012e-099a-11ed-861d-0242ac120002",
    name="118146679784",
    fullyQualifiedName="postgres_source.default",
    displayName="118146679784",
    description="",
    service=EntityReference(
        id="85811038-099a-11ed-861d-0242ac120002",
        type="databaseService",
    ),
)

MOCK_DATABASE_SCHEMA = DatabaseSchema(
    id="2aaa012e-099a-11ed-861d-0242ac120056",
    name="default",
    fullyQualifiedName="postgres_source.118146679784.default",
    displayName="default",
    description="",
    database=EntityReference(
        id="2aaa012e-099a-11ed-861d-0242ac120002",
        type="database",
    ),
    service=EntityReference(
        id="2aaa012e-099a-11ed-861d-0242ac120002",
        type="database",
    ),
)


MOCK_COLUMN_VALUE = [
    {
        "name": "username",
        "type": VARCHAR(),
        "nullable": True,
        "default": None,
        "autoincrement": False,
        "comment": None,
    },
    {
        "name": "geom_c",
        "type": GEOMETRY(),
        "nullable": True,
        "default": None,
        "autoincrement": False,
        "comment": None,
    },
    {
        "name": "point_c",
        "type": POINT(),
        "nullable": True,
        "default": None,
        "autoincrement": False,
        "comment": None,
    },
    {
        "name": "polygon_c",
        "type": POLYGON(),
        "nullable": True,
        "default": None,
        "autoincrement": False,
        "comment": None,
    },
]


EXPECTED_COLUMN_VALUE = [
    Column(
        name="username",
        displayName=None,
        dataType=DataType.VARCHAR,
        arrayDataType=None,
        dataLength=1,
        precision=None,
        scale=None,
        dataTypeDisplay="VARCHAR(1)",
        description=None,
        fullyQualifiedName=None,
        tags=None,
        constraint=Constraint.NULL,
        ordinalPosition=None,
        jsonSchema=None,
        children=None,
        columnTests=None,
        customMetrics=None,
        profile=None,
    ),
    Column(
        name="geom_c",
        displayName=None,
        dataType=DataType.GEOMETRY,
        arrayDataType=None,
        dataLength=1,
        precision=None,
        scale=None,
        dataTypeDisplay="GEOMETRY",
        description=None,
        fullyQualifiedName=None,
        tags=None,
        constraint=Constraint.NULL,
        ordinalPosition=None,
        jsonSchema=None,
        children=None,
        columnTests=None,
        customMetrics=None,
        profile=None,
    ),
    Column(
        name="point_c",
        displayName=None,
        dataType=DataType.POINT,
        arrayDataType=None,
        dataLength=1,
        precision=None,
        scale=None,
        dataTypeDisplay="POINT",
        description=None,
        fullyQualifiedName=None,
        tags=None,
        constraint=Constraint.NULL,
        ordinalPosition=None,
        jsonSchema=None,
        children=None,
        columnTests=None,
        customMetrics=None,
        profile=None,
    ),
    Column(
        name="polygon_c",
        displayName=None,
        dataType=DataType.POLYGON,
        arrayDataType=None,
        dataLength=1,
        precision=None,
        scale=None,
        dataTypeDisplay="POLYGON",
        description=None,
        fullyQualifiedName=None,
        tags=None,
        constraint=Constraint.NULL,
        ordinalPosition=None,
        jsonSchema=None,
        children=None,
        columnTests=None,
        customMetrics=None,
        profile=None,
    ),
]


class PostgresUnitTest(TestCase):
    def test_datatypes(self) -> None:
        config = OpenMetadataWorkflowConfig.parse_obj(mock_postgres_config)
        connection = config.source.serviceConnection.__root__.config
        self.postgres_source = PostgresSource.create(
            mock_postgres_config["source"],
            config.workflowConfig.openMetadataServerConfig,
        )

        self.postgres_source.context.__dict__[
            "database_service"
        ] = MOCK_DATABASE_SERVICE
        self.postgres_source.context.__dict__["database"] = MOCK_DATABASE
        self.postgres_source.context.__dict__["database_schema"] = MOCK_DATABASE_SCHEMA
        inspector = types.SimpleNamespace()
        inspector.get_columns = (
            lambda table_name, schema_name, db_name: MOCK_COLUMN_VALUE
        )
        inspector.get_pk_constraint = lambda table_name, schema_name: []
        inspector.get_unique_constraints = lambda table_name, schema_name: []
        inspector.get_foreign_keys = lambda table_name, schema_name: []

        result, _ = self.postgres_source.get_columns_and_constraints(
            "public", "user", "postgres", inspector
        )

        for i in range(len(EXPECTED_COLUMN_VALUE)):
            self.assertEqual(result[i], EXPECTED_COLUMN_VALUE[i])
