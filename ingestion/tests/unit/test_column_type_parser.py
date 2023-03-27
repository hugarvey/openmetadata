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
Test column type in column_type_parser
"""
import json
import logging
import os
from unittest import TestCase

from metadata.ingestion.source.database.column_type_parser import ColumnTypeParser

COLUMN_TYPE_PARSE = [
    "array<string>",
    "struct<a:int,b:string>",
    "struct<a:struct<b:array<string>,c:bigint>>",
    "struct<a:array<string>>",
    "struct<bigquerytestdatatype51:array<struct<bigquery_test_datatype_511:array<string>>>>",
    "struct<record_1:struct<record_2:struct<record_3:struct<record_4:string>>>>",
    "array<struct<check_datatype:array<string>>>",
    "struct<type:string,provider:array<int>>",
    "s",
    "bigint",
    "double",
    "VARCHAR(16777216)",
    "date",
    "timestamp",
    "array<int>",
    "array<struct<type:string,provider:array<int>>>",
    "array<binary>",
    "map<integer,string>",
    "string",
    "uniontype<int,double,array<string>,struct<a:int,b:string>>",
]

COLUMN_TYPE = [
    "ARRAY",
    "BIGINT",
    "BINARY VARYING",
    "CURSOR",
    "DATETIME",
    "DATETIMEOFFSET",
    "GEOGRAPHY",
    "INT2",
    "INT8",
    "INT128",
    "UINT2",
    "LONGBLOB",
    "JSONB",
    "POINT",
    "Random1",
]

EXPTECTED_COLUMN_TYPE = [
    "ARRAY",
    "BIGINT",
    "VARBINARY",
    "BINARY",
    "DATETIME",
    "DATETIME",
    "GEOGRAPHY",
    "SMALLINT",
    "BIGINT",
    "BIGINT",
    "SMALLINT",
    "LONGBLOB",
    "JSON",
    "GEOMETRY",
    "UNKNOWN",
]
root = os.path.dirname(__file__)


try:
    with open(
        os.path.join(root, "resources/expected_output_column_parser.json"),
        encoding="UTF-8",
    ) as f:
        EXPECTED_OUTPUT = json.loads(f.read())["data"]
except Exception as exc:
    logging.error(exc)


class ColumnTypeParseTest(TestCase):
    def test_check_datatype_support(self):
        for index, parse_string in enumerate(COLUMN_TYPE_PARSE):
            parsed_string = ColumnTypeParser._parse_datatype_string(  # pylint: disable=protected-access
                parse_string
            )
            self.assertTrue(
                parsed_string == EXPECTED_OUTPUT[index],
                msg=f"{index}: {parse_string} : {parsed_string}",
            )

    def test_check_column_type(self):
        self.assertEqual(len(COLUMN_TYPE), len(EXPTECTED_COLUMN_TYPE))
        for index, column in enumerate(COLUMN_TYPE):
            column_type = ColumnTypeParser.get_column_type(column_type=column)
            self.assertEqual(EXPTECTED_COLUMN_TYPE[index], column_type)
