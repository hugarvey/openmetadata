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
DataBricks SQLAlchemy Helper Methods
"""

from sqlalchemy.engine import reflection

from metadata.utils.sqlalchemy_utils import get_table_ddl_wrapper


@reflection.cache
def get_table_ddl(
    self, connection, table_name, schema=None, **kw
):  # pylint: disable=unused-argument
    return get_table_ddl_wrapper(
        self,
        connection=connection,
        query=None,
        table_name=table_name,
        schema=schema,
    )
