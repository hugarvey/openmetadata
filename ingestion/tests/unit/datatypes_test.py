import unittest
from unittest import TestCase

from metadata.ingestion.api.source import SourceStatus
from metadata.ingestion.source.sql_source import SQLSourceStatus
from metadata.utils.column_helpers import get_column_type

SQLTYPES = [
    "ARRAY",
    "BIGINT",
    "BIGNUMERIC",
    "BIGSERIAL",
    "BINARY",
    "BIT",
    "BLOB",
    "BOOL",
    "BOOLEAN",
    "BPCHAR",
    "BYTEINT",
    "BYTES",
    "CHAR",
    "CHARACTER VARYING",
    "CHARACTER",
    "CURSOR",
    "DATE",
    "DATETIME",
    "DATETIME2",
    "DATETIMEOFFSET",
    "DECIMAL",
    "DOUBLE PRECISION",
    "DOUBLE",
    "ENUM",
    "FLOAT",
    "FLOAT4",
    "FLOAT64",
    "FLOAT8",
    "GEOGRAPHY",
    "HYPERLOGLOG",
    "IMAGE",
    "INT",
    "INT2",
    "INT4",
    "INT64",
    "INT8",
    "INTEGER",
    "INTERVAL DAY TO SECOND",
    "INTERVAL YEAR TO MONTH",
    "INTERVAL",
    "JSON",
    "LONG RAW",
    "LONG VARCHAR",
    "LONG",
    "LONGBLOB",
    "MAP",
    "MEDIUMBLOB",
    "MEDIUMINT",
    "MEDIUMTEXT",
    "MONEY",
    "NCHAR",
    "NTEXT",
    "NUMBER",
    "NUMERIC",
    "NVARCHAR",
    "OBJECT",
    "RAW",
    "REAL",
    "ROWID",
    "ROWVERSION",
    "SET",
    "SMALLDATETIME",
    "SMALLINT",
    "SMALLMONEY",
    "SMALLSERIAL",
    "SQL_VARIANT",
    "STRING",
    "STRUCT",
    "TABLE",
    "TEXT",
    "TIME",
    "TIMESTAMP WITHOUT TIME ZONE",
    "TIMESTAMP",
    "TIMESTAMPTZ",
    "TIMETZ",
    "TINYINT",
    "UNION",
    "UROWID",
    "VARBINARY",
    "VARCHAR",
    "VARIANT",
    "XML",
    "XMLTYPE",
    "YEAR",
    "TIMESTAMP_NTZ",
]


class DataTypeTest(TestCase):
    def test_check_datatype_support(self):
        status = SQLSourceStatus()
        for types in SQLTYPES:
            with self.subTest(line=types):
                col_type = get_column_type(status, "Unit Test", types)
                col_type = True if col_type != "NULL" else False
                self.assertTrue(col_type, msg=types)
