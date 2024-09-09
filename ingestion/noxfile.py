import os
from dataclasses import dataclass, field
from itertools import chain
from typing import List, Set, Optional

import nox
from nox import Session

python_versions = ["3.8", "3.9", "3.10", "3.11"]

## HELPERS


@dataclass
class TestEnv:
    name: str
    extras: List[str]
    paths: List[str]
    python_versions: List[str] = field(default_factory=lambda: python_versions)

    def install_deps(self, session: Session):
        session.install(f".[{','.join(self.extras)}]")

    def to_dict(self):
        return vars(self)

    @classmethod
    def from_dict(cls, d):
        return cls(**d)


integration_test_dir = "tests/integration"


def simple_integration_env(name: str, python_versions=None):
    kwargs = (
        {
            "python_versions": python_versions,
        }
        if python_versions
        else {}
    )
    return TestEnv(
        f"integration-{name}",
        ["test", name],
        [os.path.join(integration_test_dir, name)],
        **kwargs,
    )


def parametrize(
    envs: List[TestEnv], compatible_python_versions: Optional[Set[str]] = None
):
    compatible_python_versions = compatible_python_versions or set(python_versions)
    return nox.parametrize(
        "env",
        [
            e.to_dict()
            for e in envs
            if set(compatible_python_versions).intersection(set(e.python_versions))
        ],
        [
            e.name
            for e in envs
            if set(compatible_python_versions).intersection(set(e.python_versions))
        ],
    )


def pytest_run(session: Session, env: TestEnv):
    session.run(
        "coverage",
        "run",
        "--branch",
        "--rcfile",
        "pyproject.toml",
        "--data-file",
        f"coverage/{session.python}/.coverage.{env.name}",
        "-a",
        "-m",
        "pytest",
        "-c",
        "pyproject.toml",
        f"--junitxml=junit/{session.python}/test-results-{env.name}.xml",
        *[path for path in env.paths],
    )


## ENVIRONMENTS

integration_test_envs = [
    # these tests are not supported on 3.8 because the test containers module requires python 3.9+
    simple_integration_env(x, python_versions=["3.9", "3.10", "3.11"])
    for x in ("postgres", "mysql", "kafka", "mssql", "trino")
]
integration_test_envs += [
    TestEnv(
        name="mlflow",
        extras=["test", "mlflow"],
        paths=[os.path.join(integration_test_dir, "sources/mlmodels/mlflow")],
        python_versions=["3.9", "3.10", "3.11"],
    ),
    simple_integration_env("datalake-s3"),
    # TODO: these should be moved to separate integration tests
    TestEnv(
        name="integration-others",
        paths=[
            path
            for path in os.listdir(integration_test_dir)
            if os.path.join(integration_test_dir, path)
            not in chain(*[e.paths for e in integration_test_envs])
        ],
        extras=[
            # base test dependencies
            "test",
            # integration test dependencies. these should be removed once the tests are refactored
            "athena",
            "avro",
            "bigquery",
            "bigtable",
            "clickhouse",
            "dagster",
            "databricks",
            "datalake-gcs",
            "deltalake",
            "deltalake-spark",
            "domo",
            "doris",
            "hive",
            "iceberg",
            "lkml",
            "looker",
            "mlflow",
            "mongo",
            "amundsen",
            "oracle",
            "pii-processor",
            "redshift",
            "salesforce",
            "snowflake",
            "tableau",
            "trino",
        ],
    ),
]
unit_tests = [
    TestEnv(
        name="unit",
        extras=[
            # base test dependencies
            "test",
            # packages tested in unit tests
            "athena",
            "bigquery",
            "bigtable",
            "clickhouse",
            "dagster",
            "databricks",
            "datalake-gcs",
            "deltalake-spark",
            "domo",
            "doris",
            "hive",
            "iceberg",
            "kafka",
            "lkml",
            "looker",
            "mongo",
            "mssql",
            "amundsen",
            "oracle",
            "pii-processor",
            "pgspider",
            "redshift",
            "salesforce",
            "snowflake",
            "tableau",
            "trino",
        ],
        paths=["tests/unit"],
    )
]

e2e_tests = [
    TestEnv(name=name, extras=extras, paths=["tests/cli_e2e/test_cli_" + name + ".py"])
    for (name, extras) in [
        ("bigquery", ["bigquery"]),
        ("dbt_redshift", ["redshift", "dbt"]),
        ("metabase", ["metabase"]),
        ("mssql", ["mssql"]),
        ("mysql", ["mysql"]),
        ("redash", ["redash"]),
        ("snowflake", ["snowflake"]),
        ("tableau", ["tableau"]),
        ("powerbi", ["powerbi"]),
        ("vertica", ["vertica"]),
        ("redshift", ["redshift"]),
        ("quicksight", ["quicksight"]),
        ("datalake_s3", ["datalake-s3"]),
        ("postgres", ["postgres"]),
        ("oracle", ["oracle"]),
        ("athena", ["athena"]),
        ("bigquery_multiple_project", ["bigquery"]),
    ]
]

## SESSIONS


@nox.session(python=list(set(python_versions) - {"3.8"}), tags=["integration"])
def print2(session: Session):
    print(session.python)


@nox.session(python=list(set(python_versions) - {"3.8"}), tags=["integration"])
@parametrize(integration_test_envs, set(python_versions) - {"3.8"})
def integration_tests(session: Session, env: dict):
    env = TestEnv.from_dict(env)
    env.install_deps(session)
    pytest_run(session, env)


@nox.session(python=["3.8"], tags=["integration"])
@parametrize(integration_test_envs, {"3.8"})
def integration_tests_38(session: Session, env: dict):
    env = TestEnv.from_dict(env)
    env.install_deps(session)
    pytest_run(session, env)


@nox.session(python=python_versions, tags=["unit"])
@parametrize(unit_tests)
def unit_tests(session, env: dict):
    env = TestEnv.from_dict(env)
    env.install_deps(session)
    pytest_run(session, env)


@nox.session(python=python_versions, tags=["e2e"])
@parametrize(e2e_tests)
def cli_e2e_test(session, env: dict):
    env = TestEnv.from_dict(env)
    env.install_deps(session)
    pytest_run(session, env)
