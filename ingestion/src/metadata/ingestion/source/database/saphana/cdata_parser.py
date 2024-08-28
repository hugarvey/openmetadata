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
Parse CDATA XMLs from SAP Hana
"""
import re
import traceback
import xml.etree.ElementTree as ET
from collections import defaultdict
from functools import lru_cache
from typing import Iterable, List, Optional, Set

from pydantic import Field, computed_field
from typing_extensions import Annotated

from metadata.generated.schema.api.lineage.addLineage import AddLineageRequest
from metadata.generated.schema.entity.data.table import Table
from metadata.generated.schema.entity.services.ingestionPipelines.status import (
    StackTraceError,
)
from metadata.generated.schema.type.basic import FullyQualifiedEntityName
from metadata.generated.schema.type.entityLineage import (
    ColumnLineage,
    EntitiesEdge,
    LineageDetails,
    Source,
)
from metadata.generated.schema.type.entityReference import EntityReference
from metadata.ingestion.api.models import Either
from metadata.ingestion.lineage.sql_lineage import get_column_fqn
from metadata.ingestion.models.custom_pydantic import BaseModel
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.ingestion.source.database.saphana.models import ViewType
from metadata.utils import fqn
from metadata.utils.constants import ENTITY_REFERENCE_TYPE_MAP
from metadata.utils.dispatch import enum_register


class CDATAParsingError(Exception):
    """Error parsing CDATA XML"""


XSI_NS = {"xsi": "http://www.w3.org/2001/XMLSchema-instance"}

NAMESPACE_DICT = {
    ViewType.ANALYTIC_VIEW.value: {
        "Cube": "http://www.sap.com/ndb/BiModelCube.ecore",
        **XSI_NS,
    },
    ViewType.CALCULATION_VIEW.value: {
        "Calculation": "http://www.sap.com/ndb/BiModelCalculation.ecore",
        **XSI_NS,
    },
    ViewType.ATTRIBUTE_VIEW.value: {
        "Dimension": "http://www.sap.com/ndb/BiModelDimension.ecore",
        **XSI_NS,
    },
}

FORMULA_PATTERN = re.compile(r"\"(.*?)\"")


class DataSource(BaseModel):
    """Data source from CDATA XML"""

    name: Annotated[str, Field(..., description="Data Source name")]
    location: Annotated[
        str, Field(..., description="Schema or project for the Data Source")
    ]
    source_type: Annotated[
        Optional[ViewType],
        Field(None, description="Data Source type. If not informed, source is a table"),
    ]

    def get_entity(
        self,
        metadata: OpenMetadata,
        service_name: str,
    ) -> Table:
        """Build the Entity Reference for this DataSource"""

        if not self.source_type:  # The source is a table, so the location is the schema
            fqn_ = fqn.build(
                metadata=metadata,
                entity_type=Table,
                service_name=service_name,
                database_name=None,  # TODO: Can we assume HXE?
                schema_name=self.location,
                table_name=self.name,
            )
            return metadata.get_by_name(entity=Table, fqn=fqn_)

    def __hash__(self):
        return hash(self.location) + hash(self.name) + hash(self.source_type)


class ColumnMapping(BaseModel):
    """Column Mapping from CDATA XML"""

    data_source: Annotated[DataSource, Field(..., description="Source table name")]
    sources: Annotated[List[str], Field(..., description="Source column names")]
    target: Annotated[str, Field(..., description="Destination column name")]
    formula: Annotated[
        Optional[str], Field(None, description="Formula used to derive the column")
    ]


class ParsedLineage(BaseModel):
    """Parsed Lineage from CDATA XML. For each view, we'll parse the sources"""

    mappings: Annotated[
        Optional[List[ColumnMapping]], Field([], description="Column mappings")
    ]

    @computed_field
    @property
    def sources(self) -> Set[DataSource]:
        """Get all the different source tables we'll need to iterate over"""
        return {mapping.data_source for mapping in self.mappings}

    @lru_cache(maxsize=256)
    def find_target(self, column: str) -> Optional[ColumnMapping]:
        """Find the column mapping based on the target column"""
        return next(
            (mapping for mapping in self.mappings if mapping.target == column), None
        )

    def __add__(self, other: "ParsedLineage") -> "ParsedLineage":
        """Merge two parsed lineages"""
        return ParsedLineage(mappings=self.mappings + other.mappings)

    def __hash__(self):
        """
        Note that the LRU Cache require us to implement the __hash__ method, otherwise
        the BaseModel is not hashable. Since we just want a per-instance cache, we'll use the id
        """
        return id(self)

    def to_request(
        self, metadata: OpenMetadata, service_name: str, to_entity: Table
    ) -> Iterable[Either[AddLineageRequest]]:
        """Given the target entity, build the AddLineageRequest based on the sources in `self`"""
        for source in self.sources:
            try:
                source_table = source.get_entity(
                    metadata=metadata, service_name=service_name
                )
                yield Either(
                    right=AddLineageRequest(
                        edge=EntitiesEdge(
                            fromEntity=EntityReference(
                                id=source_table.id,
                                type=ENTITY_REFERENCE_TYPE_MAP[Table.__name__],
                            ),
                            toEntity=EntityReference(
                                id=to_entity.id,
                                type=ENTITY_REFERENCE_TYPE_MAP[Table.__name__],
                            ),
                            lineageDetails=LineageDetails(
                                source=Source.ViewLineage,
                                columnsLineage=[
                                    ColumnLineage(
                                        fromColumns=[
                                            FullyQualifiedEntityName(
                                                get_column_fqn(
                                                    table_entity=source_table,
                                                    column=source_col,
                                                )
                                            )
                                            for source_col in mapping.sources
                                        ],
                                        toColumn=FullyQualifiedEntityName(
                                            get_column_fqn(
                                                table_entity=to_entity,
                                                column=mapping.target,
                                            )
                                        ),
                                        function=mapping.formula
                                        if mapping.formula
                                        else None,
                                    )
                                    for mapping in self.mappings
                                    if mapping.data_source == source
                                ],
                            ),
                        )
                    )
                )
            except Exception as exc:
                yield Either(
                    left=StackTraceError(
                        name=to_entity.fullyQualifiedName.root,
                        error=f"Error trying to get lineage for [{source}] due to [{exc}]",
                        stackTrace=traceback.format_exc(),
                    )
                )


def _read_attributes(tree: ET.Element, ns: dict) -> ParsedLineage:
    """Compute the lineage based from the attributes"""
    attribute_list = tree.find("attributes", ns) if tree else None
    if not attribute_list:
        raise CDATAParsingError(f"Error extracting attributes from tree {tree}")

    attributes = attribute_list.findall("attribute", ns)
    return ParsedLineage(
        mappings=[
            ColumnMapping(
                data_source=DataSource(
                    name=attribute.find("keyMapping", ns).get("columnObjectName"),
                    location=attribute.find("keyMapping", ns).get("schemaName"),
                ),
                sources=[attribute.find("keyMapping", ns).get("columnName")],
                target=attribute.get("id"),
            )
            for attribute in attributes
        ]
    )


def _read_calculated_attributes(
    tree: ET.Element, ns: dict, base_lineage: ParsedLineage
) -> ParsedLineage:
    """Compute the lineage based on the calculated attributes"""
    lineage = ParsedLineage()

    calculated_attrs = tree.find("calculatedAttributes", ns)
    if not calculated_attrs:
        return lineage

    for calculated_attr in calculated_attrs.findall("calculatedAttribute", ns):
        formula = calculated_attr.find("keyCalculation", ns).find("formula", ns).text
        lineage += _explode_formula(
            target=calculated_attr.get("id"), formula=formula, base_lineage=base_lineage
        )

    return lineage


def _explode_formula(
    target: str, formula: str, base_lineage: ParsedLineage
) -> ParsedLineage:
    """
    Explode the formula and extract the columns
    Args:
        formula: formula to extract involved columns from
        base_lineage: parsed lineage of the main attributes. We'll use this to pick up the original lineage columns
    Returns:
        Parsed Lineage from the formula
    """
    column_ds = {
        match.group(1): base_lineage.find_target(match.group(1)).data_source
        for match in FORMULA_PATTERN.finditer(formula)
    }

    # Group every datasource (key) with a list of the involved columns (values)
    ds_columns = defaultdict(list)
    for column, ds in column_ds.items():
        ds_columns[ds].append(column)

    return ParsedLineage(
        mappings=[
            ColumnMapping(
                # We get the source once we find the mapping of the target
                data_source=data_source,
                sources=columns,
                target=target,
                formula=formula,
            )
            for data_source, columns in ds_columns.items()
        ]
    )


parse_registry = enum_register()


@parse_registry.add(ViewType.ANALYTIC_VIEW.value)
def _(cdata: str) -> ParsedLineage:
    """Parse the CDATA XML for Analytics View"""
    ns = NAMESPACE_DICT[ViewType.ANALYTIC_VIEW.value]
    tree = ET.fromstring(cdata)
    measure_group = tree.find("privateMeasureGroup", ns)
    # TODO: Handle lineage from baseMeasures, calculatedMeasures, restrictedMeasures and sharedDimensions
    return _read_attributes(measure_group, ns)


@parse_registry.add(ViewType.ATTRIBUTE_VIEW.value)
def _(cdata: str) -> ParsedLineage:
    """Parse the CDATA XML for Analytics View"""
    ns = NAMESPACE_DICT[ViewType.ATTRIBUTE_VIEW.value]
    tree = ET.fromstring(cdata)
    attribute_lineage = _read_attributes(tree=tree, ns=ns)
    calculated_attrs_lineage = _read_calculated_attributes(
        tree=tree, ns=ns, base_lineage=attribute_lineage
    )

    return attribute_lineage + calculated_attrs_lineage


@parse_registry.add(ViewType.CALCULATION_VIEW.value)
def _(cdata: str) -> ParsedLineage:
    """Parse the CDATA XML for Calculation View"""
    return ParsedLineage()
