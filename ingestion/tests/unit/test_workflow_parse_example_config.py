from os import walk
from unittest import TestCase

from metadata.ingestion.api.parser import parse_workflow_config_gracefully

try:
    import importlib.resources as pkg_resources
except ImportError:
    import pkg_resources

import yaml


class TestWorkflowParse(TestCase):
    """
    Test parsing scenarios of JSON Schemas
    """

    def test_parse_workflow_config(self):
        package_path = f'{pkg_resources.files("metadata")}/examples/workflows'
        workflow_files = [files for _, _, files in walk(package_path)]
        for yaml_file in workflow_files[0]:
            with self.subTest(file_name=yaml_file):
                with open(f"{package_path}/{yaml_file}", "r") as file:
                    file_content = file.read()
                    self.assertTrue(
                        parse_workflow_config_gracefully(yaml.safe_load(file_content))
                    )
                    file.close()
