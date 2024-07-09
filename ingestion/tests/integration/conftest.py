import logging
import sys
from typing import List, Tuple, Type

import pytest

from _openmetadata_testutils.ometa import int_admin_ometa
from metadata.generated.schema.entity.services.databaseService import DatabaseService
from metadata.generated.schema.metadataIngestion.workflow import LogLevels
from metadata.ingestion.api.common import Entity
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.workflow.ingestion import IngestionWorkflow
from metadata.workflow.workflow_output_handler import print_status

if not sys.version_info >= (3, 9):
    collect_ignore = ["trino"]


@pytest.fixture(scope="session", autouse=True)
def configure_logging():
    logging.getLogger("sqlfluff").setLevel(logging.CRITICAL)
    logging.getLogger("pytds").setLevel(logging.CRITICAL)


@pytest.fixture(scope="session")
def metadata():
    return int_admin_ometa()


def pytest_pycollect_makeitem(collector, name, obj):
    try:
        bases = [base.__name__ for base in obj.mro()]
        for cls in ("BaseModel", "Enum"):
            if cls in bases:
                return []
    except (AttributeError, TypeError):
        pass


@pytest.fixture(scope="session", autouse=sys.version_info >= (3, 9))
def config_testcontatiners():
    from testcontainers.core.config import testcontainers_config

    testcontainers_config.max_tries = 10


@pytest.fixture(scope="session")
def sink_config(metadata):
    return {
        "type": "metadata-rest",
        "config": {},
    }


@pytest.fixture(scope="session")
def workflow_config(metadata):
    return {
        "loggerLevel": LogLevels.DEBUG.value,
        "openMetadataServerConfig": metadata.config.dict(),
    }


@pytest.fixture()
def profiler_config(db_service, workflow_config, sink_config):
    return {
        "source": {
            "type": db_service.connection.config.type.value.lower(),
            "serviceName": db_service.fullyQualifiedName.root,
            "sourceConfig": {
                "config": {
                    "type": "Profiler",
                    "generateSampleData": True,
                }
            },
        },
        "processor": {
            "type": "orm-profiler",
            "config": {},
        },
        "sink": sink_config,
        "workflowConfig": workflow_config,
    }


@pytest.fixture()
def run_workflow():
    def _run(workflow_type: type(IngestionWorkflow), config, raise_from_status=True):
        workflow: IngestionWorkflow = workflow_type.create(config)
        workflow.execute()
        if raise_from_status:
            try:
                workflow.raise_from_status()
            except Exception:
                print_status(workflow)
                raise
        return workflow

    return _run


@pytest.fixture(scope="module")
def db_service(metadata, create_service_request, patch_password, cleanup_fqns):
    service_entity = metadata.create_or_update(data=create_service_request)
    fqn = service_entity.fullyQualifiedName.root
    yield patch_password(service_entity)
    cleanup_fqns(DatabaseService, fqn)


@pytest.fixture(scope="module")
def patch_password():
    """Implement in the test module to override the password for a specific service

    Example:
    def patch_password(service: DatabaseService, my_contianer):
        service.connection.config.authType.password = SecretStr(my_contianer.password)
        return service
    return patch_password
    """
    raise NotImplementedError("Implement in the test module")


@pytest.fixture()
def patch_passwords_for_db_services(db_service, patch_password, monkeypatch):
    def override_password(getter):
        def inner(*args, **kwargs):
            result = getter(*args, **kwargs)
            if isinstance(result, DatabaseService):
                if result.fullyQualifiedName.root == db_service.fullyQualifiedName.root:
                    return patch_password(result)
            return result

        return inner

    monkeypatch.setattr(
        "metadata.ingestion.ometa.ometa_api.OpenMetadata.get_by_name",
        override_password(OpenMetadata.get_by_name),
    )

    monkeypatch.setattr(
        "metadata.ingestion.ometa.ometa_api.OpenMetadata.get_by_id",
        override_password(OpenMetadata.get_by_id),
    )


@pytest.fixture
def cleanup_fqns(metadata):
    fqns: List[Tuple[Type[Entity], str]] = []

    def inner(entity_type: Type[Entity], fqn: str):
        fqns.append((entity_type, fqn))

    yield inner
    for etype, fqn in fqns:
        entity = metadata.get_by_name(etype, fqn, fields=["*"])
        if entity:
            metadata.delete(etype, entity.id, recursive=True, hard_delete=True)
