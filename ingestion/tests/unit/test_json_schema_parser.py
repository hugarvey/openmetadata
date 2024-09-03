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
Jsonschema parser tests
"""
from unittest import TestCase

from metadata.generated.schema.entity.data.table import Column
from metadata.parsers.json_schema_parser import parse_json_schema


class JsonSchemaParserTests(TestCase):
    """
    Check methods from json_schema_parser.py
    """

    sample_json_schema = """{
        "$id": "https://example.com/person.schema.json",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Person",
        "type": "object",
        "properties": {
            "firstName": {
            "type": "string",
            "title": "First Name",
            "description": "The person's first name."
            },
            "lastName": {
            "type": "string",
            "title": "Last Name",
            "description": "The person's last name."
            },
            "age": {
            "description": "Age in years which must be equal to or greater than zero.",
            "type": "integer",
            "title": "Person Age",
            "minimum": 0
            }
        }
    }"""

    sample_postgres_json_schema = """{
        "title": "review_details",
        "type": "object",
        "properties":
        {
            "staff": {
                "title": "staff",
                "type": "array",
                "properties": {}
            },
            "services": {
                "title": "services",
                "type": "object",
                "properties": {
                    "lunch": {
                        "title": "lunch",
                        "type": "string",
                        "properties": {}
                    },
                    "check_in": {
                        "title": "check_in",
                        "type": "string",
                        "properties": {}
                    },
                    "check_out": {
                        "title": "check_out",
                        "type": "string",
                        "properties": {}
                    },
                    "additional_services": {
                        "title": "additional_services",
                        "type": "array",
                        "properties": {}
                    }
                }
            },
            "overall_experience": {
                "title": "overall_experience",
                "type": "string"
            }
        }
    }"""

    parsed_schema = parse_json_schema(sample_json_schema)
    parsed_postgres_schema = parse_json_schema(sample_postgres_json_schema, Column)

    def test_schema_name(self):
        self.assertEqual(self.parsed_schema[0].name.root, "Person")

    def test_schema_type(self):
        self.assertEqual(self.parsed_schema[0].dataType.name, "RECORD")

    def test_field_names(self):
        field_names = {str(field.name.root) for field in self.parsed_schema[0].children}
        self.assertEqual(field_names, {"firstName", "lastName", "age"})

        # validate display names
        field_display_names = {
            str(field.displayName) for field in self.parsed_schema[0].children
        }
        self.assertEqual(field_display_names, {"First Name", "Last Name", "Person Age"})

    def test_field_types(self):
        field_types = {
            str(field.dataType.name) for field in self.parsed_schema[0].children
        }
        self.assertEqual(field_types, {"INT", "STRING"})

    def test_field_descriptions(self):
        field_descriptions = {
            str(field.description.root) for field in self.parsed_schema[0].children
        }
        self.assertEqual(
            field_descriptions,
            {
                "The person's first name.",
                "The person's last name.",
                "Age in years which must be equal to or greater than zero.",
            },
        )

    def test_parse_postgres_json_fields(self):
        self.assertEqual(self.parsed_postgres_schema[0].name.root, "review_details")
        self.assertEqual(self.parsed_postgres_schema[0].children[0].name.root, "staff")
        self.assertEqual(
            self.parsed_postgres_schema[0].children[1].name.root, "services"
        )
        self.assertEqual(
            self.parsed_postgres_schema[0].children[1].children[0].name.root, "lunch"
        )
        self.assertEqual(
            self.parsed_postgres_schema[0].children[1].dataType.name, "RECORD"
        )
        self.assertEqual(len(self.parsed_postgres_schema[0].children), 3)
        self.assertEqual(len(self.parsed_postgres_schema[0].children[1].children), 4)
