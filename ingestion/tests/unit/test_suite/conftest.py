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
shared test cases
"""

import os
from datetime import datetime, timedelta
from unittest.mock import patch
from uuid import uuid4

import pytest
import sqlalchemy as sqa
from sqlalchemy.orm import declarative_base

from metadata.data_quality.interface.sqlalchemy.sqa_test_suite_interface import (
    SQATestSuiteInterface,
)
from metadata.generated.schema.entity.data.table import Column, DataType, Table
from metadata.generated.schema.entity.services.connections.database.sqliteConnection import (
    SQLiteConnection,
    SQLiteScheme,
)
from metadata.generated.schema.tests.testCase import TestCase, TestCaseParameterValue
from metadata.generated.schema.type.entityReference import EntityReference

Base = declarative_base()

TEST_CASE_NAME = "my_test_case"
ENTITY_LINK_NICKNAME = "<#E::table::service.db.users::columns::nickname>"
ENTITY_LINK_FNAME = "<#E::table::service.db.users::columns::first name>"
ENTITY_LINK_AGE = "<#E::table::service.db.users::columns::age>"
ENTITY_LINK_NAME = "<#E::table::service.db.users::columns::name>"
ENTITY_LINK_USER = "<#E::table::service.db.users>"
ENTITY_LINK_INSERTED_DATE = "<#E::table::service.db.users::columns::inserted_date>"

TABLE = Table(
    id=uuid4(),
    name="users",
    fullyQualifiedName="service.db.users",
    columns=[
        Column(name="id", dataType=DataType.INT),  # type: ignore
        Column(name="name", dataType=DataType.STRING),  # type: ignore
        Column(name="first name", dataType=DataType.STRING),  # type: ignore
        Column(name="fullname", dataType=DataType.STRING),  # type: ignore
        Column(name="nickname", dataType=DataType.STRING),  # type: ignore
        Column(name="age", dataType=DataType.INT),  # type: ignore
        Column(name="inserted_date", dataType=DataType.DATE),  # type: ignore
    ],
    database=EntityReference(id=uuid4(), name="db", type="database"),  # type: ignore
)  # type: ignore


class User(Base):
    __tablename__ = "users"
    id = sqa.Column(sqa.Integer, primary_key=True)
    name = sqa.Column(sqa.String(256))
    first_name = sqa.Column("first name", sqa.String(256))
    fullname = sqa.Column(sqa.String(256))
    nickname = sqa.Column(sqa.String(256))
    age = sqa.Column(sqa.Integer)
    inserted_date = sqa.Column(sqa.DATE)


@pytest.fixture
def create_sqlite_table():
    """create and delete sqlite table"""
    db_path = os.path.join(
        os.path.dirname(__file__), f"{os.path.splitext(__file__)[0]}.db"
    )
    sqlite_conn = SQLiteConnection(
        scheme=SQLiteScheme.sqlite_pysqlite,
        databaseMode=db_path + "?check_same_thread=False",
    )  # type: ignore

    with patch.object(
        SQATestSuiteInterface, "_convert_table_to_orm_object", return_value=User
    ):
        sqa_profiler_interface = SQATestSuiteInterface(
            sqlite_conn,  # type: ignore
            table_entity=TABLE,
            ometa_client=None,  # type: ignore
        )

    runner = sqa_profiler_interface.runner
    engine = sqa_profiler_interface.session.get_bind()
    session = sqa_profiler_interface.session

    User.__table__.create(bind=engine)
    for i in range(10):
        data = [
            User(
                name="John",
                first_name="Jo",
                fullname="John Doe",
                nickname="johnny b goode",
                age=30,
                inserted_date=datetime.today() - timedelta(days=i),
            ),
            User(
                name="Jane",
                first_name="Ja",
                fullname="Jone Doe",
                nickname="Johnny d",
                age=31,
                inserted_date=datetime.today() - timedelta(days=i),
            ),
            User(
                name="John",
                first_name="Joh",
                fullname="John Doe",
                nickname=None,
                age=None,
                inserted_date=datetime.today() - timedelta(days=i),
            ),
        ]
        session.add_all(data)
        session.commit()

    yield runner
    # clean up
    User.__table__.drop(bind=engine)
    os.remove(db_path)


@pytest.fixture
def test_case_column_value_length_to_be_between():
    """Test case for test column_value_length_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NICKNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minLength", value="1"),
            TestCaseParameterValue(name="maxLength", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_length_to_be_between_col_space():
    """Test case for test column_value_length_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_FNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minLength", value="1"),
            TestCaseParameterValue(name="maxLength", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_length_to_be_between_no_min():
    """Test case for test column_value_length_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_FNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="maxLength", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_max_to_be_between():
    """Test case for test column_value_max_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForMaxInCol", value="1"),
            TestCaseParameterValue(name="maxValueForMaxInCol", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_max_to_be_between_no_min():
    """Test case for test column_value_max_to_be_between_no_min"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="maxValueForMaxInCol", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_mean_to_be_between():
    """Test case for test column_value_mean_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForMeanInCol", value="1"),
            TestCaseParameterValue(name="maxValueForMeanInCol", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_mean_to_be_between_no_max():
    """Test case for test column_value_mean_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForMeanInCol", value="1"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_median_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForMedianInCol", value="1"),
            TestCaseParameterValue(name="maxValueForMedianInCol", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_min_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForMinInCol", value="25"),
            TestCaseParameterValue(name="maxValueForMinInCol", value="40"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_min_to_be_between_no_min():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="maxValueForMinInCol", value="40"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_stddev_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForStdDevInCol", value="20"),
            TestCaseParameterValue(name="maxValueForStdDevInCol", value="40"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_stddev_to_be_between_no_min():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="maxValueForStdDevInCol", value="40"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_value_in_set():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="allowedValues", value="['John']"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_missing_count_to_be_equal():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NICKNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="missingCountValue", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_missing_count_to_be_equal_missing_values():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NICKNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="missingCountValue", value="10"),
            TestCaseParameterValue(name="missingValueMatch", value="['Johnny d']"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_not_in_set():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="forbiddenValues", value="['John']"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_sum_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValueForColSum", value="10"),
            TestCaseParameterValue(name="maxValueForColSum", value="100"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_AGE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValue", value="29"),
            TestCaseParameterValue(name="maxValue", value="33"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_to_be_not_null():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NICKNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
    )  # type: ignore


@pytest.fixture
def test_case_column_values_to_be_unique():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NICKNAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
    )  # type: ignore


@pytest.fixture
def test_case_column_values_to_match_regex():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="regex", value="J.*"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_to_not_match_regex():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="forbiddenRegex", value="X%"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_column_count_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minColValue", value="2"),
            TestCaseParameterValue(name="maxColValue", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_column_count_to_equal():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[TestCaseParameterValue(name="columnCount", value="8")],
    )  # type: ignore


@pytest.fixture
def test_case_table_column_name_to_exist():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[TestCaseParameterValue(name="columnName", value="id")],
    )  # type: ignore


@pytest.fixture
def test_case_column_to_match_set():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="columnNames", value="id,name,nickname")
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_to_match_set_ordered():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(
                name="columnNames", value="id,name,nickname,fullname,age"
            ),
            TestCaseParameterValue(name="ordered", value="True"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_custom_sql_query():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_NAME,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(
                name="sqlExpression", value="SELECT * FROM users WHERE age > 20"
            ),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_custom_sql_query_success():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(
                name="sqlExpression", value="SELECT * FROM users WHERE age < 0"
            ),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_row_count_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValue", value="10"),
            TestCaseParameterValue(name="maxValue", value="35"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_row_count_to_be_equal():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="value", value="10"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_row_inserted_count_to_be_between():
    """Test case for test column_value_median_to_be_between"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="min", value="3"),
            TestCaseParameterValue(name="columnName", value="inserted_date"),
            TestCaseParameterValue(name="rangeType", value="DAY"),
            TestCaseParameterValue(name="rangeInterval", value="1"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_table_custom_sql_query_failed_dl():
    """Test case for test custom SQL table test"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="sqlExpression", value="age > 30"),
        ],
    )


@pytest.fixture
def test_case_table_custom_sql_query_success_dl():
    """Test case for test custom SQL table test"""
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_USER,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="sqlExpression", value="age < 0"),
        ],
    )


@pytest.fixture
def test_case_column_values_to_be_between_date():
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_INSERTED_DATE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValue", value="1625127852000"),
            TestCaseParameterValue(name="maxValue", value="1625127852000"),
        ],
    )  # type: ignore


@pytest.fixture
def test_case_column_values_to_be_between_datetime():
    return TestCase(
        name=TEST_CASE_NAME,
        entityLink=ENTITY_LINK_INSERTED_DATE,
        testSuite=EntityReference(id=uuid4(), type="TestSuite"),  # type: ignore
        testDefinition=EntityReference(id=uuid4(), type="TestDefinition"),  # type: ignore
        parameterValues=[
            TestCaseParameterValue(name="minValue", value="1625127852000"),
            TestCaseParameterValue(name="maxValue", value="1625171052000"),
        ],
    )  # type: ignore
