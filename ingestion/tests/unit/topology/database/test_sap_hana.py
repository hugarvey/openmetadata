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
Test SAP Hana source
"""
from pathlib import Path

from metadata.ingestion.source.database.saphana.cdata_parser import (
    ColumnMapping,
    DataSource,
    ParsedLineage,
    ViewType,
    parse_registry,
)

RESOURCES_DIR = Path(__file__).parent.parent.parent / "resources" / "saphana"


def test_parse_analytic_view() -> None:
    """Read the resource and parse the file"""

    with open(RESOURCES_DIR / "cdata_analytic_view.xml") as file:
        cdata = file.read()
        parse_fn = parse_registry.registry.get(ViewType.ANALYTIC_VIEW.value)
        parsed_lineage: ParsedLineage = parse_fn(cdata)

    assert parsed_lineage
    assert len(parsed_lineage.mappings) == 6
    assert parsed_lineage.sources == {DataSource(name="SBOOK", location="SFLIGHT")}
    assert parsed_lineage.mappings[0] == ColumnMapping(
        data_source=DataSource(name="SBOOK", location="SFLIGHT"),
        sources=["MANDT"],
        target="MANDT",
    )


def test_parse_attribute_view() -> None:
    """Read the resource and parse the file"""

    with open(RESOURCES_DIR / "cdata_attribute_view.xml") as file:
        cdata = file.read()
        parse_fn = parse_registry.registry.get(ViewType.ATTRIBUTE_VIEW.value)
        parsed_lineage: ParsedLineage = parse_fn(cdata)

    assert parsed_lineage
    assert len(parsed_lineage.mappings) == 20  # 15 columns + 5 derived from formulas
    assert parsed_lineage.sources == {
        DataSource(name="SCARR", location="SFLIGHT"),
        DataSource(name="SFLIGHT", location="SFLIGHT"),
    }
    assert parsed_lineage.mappings[0] == ColumnMapping(
        data_source=DataSource(name="SFLIGHT", location="SFLIGHT"),
        sources=["MANDT"],
        target="MANDT",
    )


def test_parse_cv_tab() -> None:
    """Read the resource and parse the file"""

    with open(RESOURCES_DIR / "cdata_calculation_view_tab.xml") as file:
        cdata = file.read()
        parse_fn = parse_registry.registry.get(ViewType.CALCULATION_VIEW.value)
        parsed_lineage: ParsedLineage = parse_fn(cdata)

    assert parsed_lineage
    assert len(parsed_lineage.mappings) == 10  # 5 columns + 5 derived from formulas
    assert parsed_lineage.sources == {
        DataSource(name="SCARR", location="SFLIGHT"),
        DataSource(name="SFLIGHT", location="SFLIGHT"),
    }
    assert parsed_lineage.mappings[0] == ColumnMapping(
        data_source=DataSource(name="SFLIGHT", location="SFLIGHT"),
        sources=["MANDT"],
        target="MANDT",
    )
    assert parsed_lineage.mappings[5] == ColumnMapping(
        data_source=DataSource(name="SCARR", location="SFLIGHT"),
        sources=["CARRID"],
        target="CARRID",
    )
