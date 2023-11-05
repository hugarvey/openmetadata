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
Profiler Processor Step
"""

import traceback
from datetime import datetime
from functools import singledispatch
from io import BytesIO

import pandas as pd

from metadata.clients.aws_client import AWSClient
from metadata.generated.schema.entity.data.table import Table, TableData
from metadata.generated.schema.security.credentials.awsCredentials import AWSCredentials
from metadata.profiler.interface.profiler_interface import ProfilerInterface
from metadata.utils.helpers import clean_uri
from metadata.utils.logger import profiler_logger

logger = profiler_logger()


def _get_object_key(table: Table, prefix: str, overwrite_data: bool) -> str:
    if not overwrite_data:
        file_name = f"sample_data_{datetime.now().strftime('%Y_%m_%d')}.parquet"
    else:
        file_name = "sample_data.parquet"
    path = str(table.fullyQualifiedName.__root__).replace(".", "/")
    if prefix:
        return f"{clean_uri(prefix)}/{path}/{file_name}"
    return f"{path}/{file_name}"


def upload_sample_data(data: TableData, profiler_interface: ProfilerInterface) -> None:
    try:

        sample_storage_config = profiler_interface.storage_config
        if not sample_storage_config:
            return
        df = pd.DataFrame(data=data.rows, columns=[i.__root__ for i in data.columns])
        pq_buffer = BytesIO()
        df.to_parquet(pq_buffer)
        object_key = _get_object_key(
            table=profiler_interface.table_entity,
            prefix=sample_storage_config.prefix,
            overwrite_data=sample_storage_config.overwriteData,
        )
        upload_to_storage(
            sample_storage_config.storageConfig,
            pq_buffer,
            sample_storage_config.bucketName,
            object_key,
        )
    except Exception as err:
        logger.debug(traceback.format_exc())
        logger.warning(f"Error uploading the sample data: {err}")


@singledispatch
def upload_to_storage(storage_config, pq_buffer, bucket_name, object_key):
    """
    Do noting if storage not supported or storage type openmetadata
    """


@upload_to_storage.register
def _(
    storage_config: AWSCredentials,
    pq_buffer: BytesIO,
    bucket_name: str,
    object_key: str,
):
    aws_client = AWSClient(config=storage_config).get_client("s3")
    aws_client.put_object(
        Body=pq_buffer.getvalue(),
        Bucket=bucket_name,
        Key=object_key,
    )
    logger.debug(f"Sample Data Successfully Uploaded to {object_key}")
