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
Test SQA Interface
"""

import os
from unittest import TestCase

from pytest import raises
from sqlalchemy import TEXT, Column, Integer, String, inspect
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm.session import Session

from metadata.generated.schema.entity.data.table import ColumnProfile, TableProfile
from metadata.generated.schema.entity.services.connections.database.sqliteConnection import (
    SQLiteConnection,
    SQLiteScheme,
)
from metadata.orm_profiler.interfaces.sqa_profiler_interface import SQAProfilerInterface
from metadata.orm_profiler.metrics.core import (
    ComposedMetric,
    MetricTypes,
    QueryMetric,
    StaticMetric,
)
from metadata.orm_profiler.metrics.static.row_count import RowCount
from metadata.orm_profiler.profiler.default import get_default_metrics
from metadata.orm_profiler.profiler.runner import QueryRunner
from metadata.orm_profiler.profiler.sampler import Sampler


class User(declarative_base()):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(256))
    fullname = Column(String(256))
    nickname = Column(String(256))
    comments = Column(TEXT)
    age = Column(Integer)


class SQAProfilerInterfaceTest(TestCase):
    def setUp(self) -> None:
        sqlite_conn = SQLiteConnection(
            scheme=SQLiteScheme.sqlite_pysqlite,
        )
        self.sqa_profiler_interface = SQAProfilerInterface(sqlite_conn)
        self.table = User

    def test_init_interface(self):
        """Test we can instantiate our interface object correctly"""

        assert self.sqa_profiler_interface._sampler == None
        assert self.sqa_profiler_interface._runner == None
        assert isinstance(self.sqa_profiler_interface.session, Session)

    def test_create_sampler(self):
        """Test we can create our sampler correctly"""
        self.sqa_profiler_interface.create_sampler(
            self.table,
        )

        assert isinstance(self.sqa_profiler_interface.sampler, Sampler)

    def test_create_runner(self):
        """Test we can create our sampler correctly"""

        with raises(RuntimeError):
            self.sqa_profiler_interface.create_runner(self.table)

        self.sqa_profiler_interface.create_sampler(self.table)
        self.sqa_profiler_interface.create_runner(self.table)
        assert isinstance(self.sqa_profiler_interface.runner, QueryRunner)

    def test_private_attributes(self):
        with raises(AttributeError):
            self.sqa_profiler_interface.runner = None
            self.sqa_profiler_interface.sampler = None
            self.sqa_profiler_interface.sample = None

    def tearDown(self) -> None:
        self.sqa_profiler_interface._sampler = None


class SQAProfilerInterfaceTestMultiThread(TestCase):

    db_path = os.path.join(os.path.dirname(__file__), "test.db")
    sqlite_conn = SQLiteConnection(
        scheme=SQLiteScheme.sqlite_pysqlite,
        databaseMode=db_path + "?check_same_thread=False",
    )
    sqa_profiler_interface = SQAProfilerInterface(sqlite_conn)

    @classmethod
    def setUpClass(cls) -> None:
        """
        Prepare Ingredients
        """
        User.__table__.create(bind=cls.sqa_profiler_interface.session.get_bind())

        data = [
            User(name="John", fullname="John Doe", nickname="johnny b goode", age=30),
            User(name="Jane", fullname="Jone Doe", nickname=None, age=31),
        ]
        cls.sqa_profiler_interface.session.add_all(data)
        cls.sqa_profiler_interface.session.commit()
        cls.table = User
        cls.metrics = get_default_metrics(cls.table)
        cls.static_metrics = [
            metric for metric in cls.metrics if issubclass(metric, StaticMetric)
        ]
        cls.composed_metrics = [
            metric for metric in cls.metrics if issubclass(metric, ComposedMetric)
        ]
        cls.window_metrics = [
            metric
            for metric in cls.metrics
            if issubclass(metric, StaticMetric) and metric.is_window_metric()
        ]
        cls.query_metrics = [
            metric
            for metric in cls.metrics
            if issubclass(metric, QueryMetric) and metric.is_col_metric()
        ]

    def test_init_interface(self):
        """Test we can instantiate our interface object correctly"""

        assert self.sqa_profiler_interface._sampler == None
        assert self.sqa_profiler_interface._runner == None
        assert isinstance(self.sqa_profiler_interface.session, Session)

    def test_get_all_metrics(self):
        table_metrics = [
            (
                [metric for metric in self.metrics if not metric.is_col_metric()],
                MetricTypes.Table,
                None,
                self.table,
                None,
                None,
                None,
            )
        ]
        column_metrics = []
        query_metrics = []
        window_metrics = []
        for col in inspect(User).c:
            column_metrics.append(
                (
                    [
                        metric
                        for metric in self.static_metrics
                        if metric.is_col_metric() and not metric.is_window_metric()
                    ],
                    MetricTypes.Static,
                    col,
                    self.table,
                    None,
                    None,
                    None,
                )
            )
            for query_metric in self.query_metrics:
                query_metrics.append(
                    (
                        query_metric,
                        MetricTypes.Query,
                        col,
                        self.table,
                        None,
                        None,
                        None,
                    )
                )
            for window_metric in self.window_metrics:
                window_metrics.append(
                    (
                        window_metric,
                        MetricTypes.Window,
                        col,
                        self.table,
                        None,
                        None,
                        None,
                    )
                )

        all_metrics = [*table_metrics, *column_metrics, *query_metrics, *window_metrics]

        profile_results = self.sqa_profiler_interface.get_all_metrics(
            all_metrics,
        )

        column_profile = [
            ColumnProfile(**profile_results["columns"].get(col.name))
            for col in inspect(User).c
            if profile_results["columns"].get(col.name)
        ]

        table_profile = TableProfile(
            columnCount=profile_results["table"].get("columnCount"),
            rowCount=profile_results["table"].get(RowCount.name()),
            columnProfile=column_profile,
            profileQuery=None,
            profileSample=None,
        )

        assert table_profile.columnCount == 6
        assert table_profile.rowCount == 2
        name_column_profile = [
            profile for profile in table_profile.columnProfile if profile.name == "name"
        ][0]
        id_column_profile = [
            profile for profile in table_profile.columnProfile if profile.name == "id"
        ][0]
        assert name_column_profile.nullCount == 0
        assert id_column_profile.median == 1.5

    @classmethod
    def tearDownClass(cls) -> None:
        os.remove(cls.db_path)
        return super().tearDownClass()
