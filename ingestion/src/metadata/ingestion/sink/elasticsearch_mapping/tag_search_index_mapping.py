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
Defines the Elasticsearch mapping for Tags
"""
import textwrap

TAG_ELASTICSEARCH_INDEX_MAPPING = textwrap.dedent(
    """
{
  "settings": {
    "analysis": {
      "normalizer": {
        "lowercase_normalizer": {
          "type": "custom",
          "char_filter": [],
          "filter": [
            "lowercase"
          ]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": {
        "type": "text"
      },
      "name": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "fullyQualifiedName": {
        "type": "keyword",
        "normalizer": "lowercase_normalizer"
      },
      "description": {
        "type": "text"
      },
      "version": {
        "type": "float"
      },
      "updatedAt": {
        "type": "date",
        "format": "epoch_second"
      },
      "updatedBy": {
        "type": "text"
      },
      "href": {
        "type": "text"
      },
      "deleted": {
        "type": "text"
      },
      "deprecated": {
        "type": "boolean"
      },
      "suggest": {
        "type": "completion",
        "contexts": [
          {
            "name": "deleted",
            "type": "category",
            "path": "deleted"
          }
        ]
      }
    }
  }
}
"""
)
