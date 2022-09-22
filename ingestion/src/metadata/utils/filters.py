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
Helper that implements table and filter pattern logic.
Most of these methods are applying the same logic,
but assigning specific names helps better follow the
code.
"""
import re
from typing import List, Optional

from metadata.generated.schema.type.filterPattern import FilterPattern


class InvalidPatternException(Exception):
    """
    Raised when an invalid pattern is configured in the workflow
    """


def validate_regex(regex_list: List[str]) -> None:
    """
    Check that the given include/exclude regexes
    are well formatted
    """
    for regex in regex_list:
        try:
            re.compile(regex)
        except re.error as err:
            msg = f"Invalid regex [{regex}]: {err}"
            raise InvalidPatternException(msg)


def _filter(filter_pattern: Optional[FilterPattern], name: str) -> bool:
    """
    Return True if the name needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param filter_pattern: Model defining filtering logic
    :param name: table or schema name
    :return: True for filtering, False otherwise
    """
    if not filter_pattern:
        # No filter pattern, nothing to filter
        return False

    if filter_pattern.includes:
        validate_regex(filter_pattern.includes)
        return not any(
            [
                name
                for regex in filter_pattern.includes
                if (re.match(regex, name, re.IGNORECASE))
            ]
        )

    if filter_pattern.excludes:
        validate_regex(filter_pattern.excludes)
        return any(
            [
                name
                for regex in filter_pattern.excludes
                if (re.match(regex, name, re.IGNORECASE))
            ]
        )

    return False


def filter_by_schema(
    schema_filter_pattern: Optional[FilterPattern], schema_fqn: str
) -> bool:
    """
    Return True if the schema needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param schema_filter_pattern: Model defining schema filtering logic
    :param schema fqn: table schema fqn
    :return: True for filtering, False otherwise
    """
    return _filter(schema_filter_pattern, schema_fqn)


def filter_by_table(
    table_filter_pattern: Optional[FilterPattern], table_fqn: str
) -> bool:
    """
    Return True if the table needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param table_filter_pattern: Model defining schema filtering logic
    :param table_fqn: table fqn
    :return: True for filtering, False otherwise
    """
    return _filter(table_filter_pattern, table_fqn)


def filter_by_chart(
    chart_filter_pattern: Optional[FilterPattern], chart_fqn: str
) -> bool:
    """
    Return True if the chart needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param chart_filter_pattern: Model defining chart filtering logic
    :param chart_fqn: chart fqn
    :return: True for filtering, False otherwise
    """
    return _filter(chart_filter_pattern, chart_fqn)


def filter_by_topic(
    topic_filter_pattern: Optional[FilterPattern], topic_fqn: str
) -> bool:
    """
    Return True if the topic needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param topic_filter_pattern: Model defining chart filtering logic
    :param topic_fqn: topic fqn
    :return: True for filtering, False otherwise
    """
    return _filter(topic_filter_pattern, topic_fqn)


def filter_by_dashboard(
    dashboard_filter_pattern: Optional[FilterPattern], dashboard_fqn: str
) -> bool:
    """
    Return True if the dashboard needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param dashboard_filter_pattern: Model defining dashboard filtering logic
    :param dashboard_fqn: dashboard fqn
    :return: True for filtering, False otherwise
    """
    return _filter(dashboard_filter_pattern, dashboard_fqn)


def filter_by_fqn(fqn_filter_pattern: Optional[FilterPattern], fqn: str) -> bool:
    """
    Return True if the FQN needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param fqn_filter_pattern: Model defining FQN filtering logic
    :param fqn: table FQN name
    :return: True for filtering, False otherwise
    """
    return _filter(fqn_filter_pattern, fqn)


def filter_by_database(
    database_filter_pattern: Optional[FilterPattern], database_fqn: str
) -> bool:
    """
    Return True if the schema needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param database_filter_pattern: Model defining database filtering logic
    :param database_fqn: database fqn
    :return: True for filtering, False otherwise
    """
    return _filter(database_filter_pattern, database_fqn)


def filter_by_pipeline(
    pipeline_filter_pattern: Optional[FilterPattern], pipeline_fqn: str
) -> bool:
    """
    Return True if the schema needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param pipeline_filter_pattern: Model defining the pipeline filtering logic
    :param pipeline_fqn: pipeline fqn
    :return: True for filtering, False otherwise
    """
    return _filter(pipeline_filter_pattern, pipeline_fqn)


def filter_by_mlmodel(
    mlmodel_filter_pattern: Optional[FilterPattern], mlmodel_fqn: str
) -> bool:
    """
    Return True if the mlmodel needs to be filtered, False otherwise

    Include takes precedence over exclude

    :param mlmodel_filter_pattern: Model defining the mlmodel filtering logic
    :param mlmodel_fqn: mlmodel fqn
    :return: True for filtering, False otherwise
    """
    return _filter(mlmodel_filter_pattern, mlmodel_fqn)
