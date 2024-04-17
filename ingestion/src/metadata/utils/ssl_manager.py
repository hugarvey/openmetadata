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
Module to manage SSL certificates
"""
import os
import tempfile
from functools import singledispatch, singledispatchmethod
from typing import Optional, Union, cast

from metadata.generated.schema.entity.services.connections.dashboard.qlikSenseConnection import (
    QlikSenseConnection,
)
from metadata.generated.schema.entity.services.connections.database.dorisConnection import (
    DorisConnection,
)
from metadata.generated.schema.entity.services.connections.database.greenplumConnection import (
    GreenplumConnection,
)
from metadata.generated.schema.entity.services.connections.database.mysqlConnection import (
    MysqlConnection,
)
from metadata.generated.schema.entity.services.connections.database.postgresConnection import (
    PostgresConnection,
)
from metadata.generated.schema.entity.services.connections.database.redshiftConnection import (
    RedshiftConnection,
)
from metadata.generated.schema.entity.services.connections.messaging.kafkaConnection import (
    KafkaConnection,
)
from metadata.generated.schema.security.ssl import verifySSLConfig
from metadata.ingestion.connections.builders import init_empty_connection_arguments


class SSLManager:
    "SSL Manager to manage SSL certificates for service connections"

    def __init__(self, ca, key=None, cert=None):
        self.temp_files = []
        self.ca_file_path = self.create_temp_file(ca)
        self.cert_file_path = None
        self.key_file_path = None
        if cert:
            self.cert_file_path = self.create_temp_file(cert)
        if key:
            self.key_file_path = self.create_temp_file(key)

    def create_temp_file(self, content):
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(content.encode())
            temp_file.close()
        self.temp_files.append(temp_file.name)
        return temp_file.name

    def cleanup_temp_files(self):
        for temp_file in self.temp_files:
            try:
                os.remove(temp_file)
            except FileNotFoundError:
                pass
        self.temp_files = []

    @singledispatchmethod
    def setup_ssl(self, connection):
        raise NotImplementedError(f"Connection {type(connection)} type not supported")

    @setup_ssl.register(MysqlConnection)
    @setup_ssl.register(DorisConnection)
    def _(self, connection):
        # Use the temporary file paths for SSL configuration
        connection = cast(Union[MysqlConnection, DorisConnection], connection)
        connection.connectionArguments = (
            connection.connectionArguments or init_empty_connection_arguments()
        )
        ssl_args = connection.connectionArguments.__root__.get("ssl", {})
        if connection.sslConfig.__root__.caCertificate:
            ssl_args["ssl_ca"] = self.ca_file_path
        if connection.sslConfig.__root__.sslCertificate:
            ssl_args["ssl_cert"] = self.cert_file_path
        if connection.sslConfig.__root__.sslKey:
            ssl_args["ssl_key"] = self.key_file_path
        connection.connectionArguments.__root__["ssl"] = ssl_args
        return connection

    @setup_ssl.register(PostgresConnection)
    @setup_ssl.register(RedshiftConnection)
    @setup_ssl.register(GreenplumConnection)
    def _(self, connection):
        connection = cast(
            Union[PostgresConnection, RedshiftConnection, GreenplumConnection],
            connection,
        )

        if not connection.connectionArguments:
            connection.connectionArguments = init_empty_connection_arguments()
        connection.connectionArguments.__root__["sslmode"] = connection.sslMode.value
        if connection.sslMode in (
            verifySSLConfig.SslMode.verify_ca,
            verifySSLConfig.SslMode.verify_full,
        ):
            connection.connectionArguments.__root__["sslrootcert"] = self.ca_file_path
        return connection

    @setup_ssl.register(QlikSenseConnection)
    def _(self, _):
        return {
            "ca_certs": self.ca_file_path,
            "certfile": self.cert_file_path,
            "keyfile": self.key_file_path,
        }

    @setup_ssl.register(KafkaConnection)
    def _(self, connection):
        connection = cast(KafkaConnection, connection)
        connection.schemaRegistryConfig["ssl.ca.location"] = self.ca_file_path
        connection.schemaRegistryConfig["ssl.key.location"] = self.key_file_path
        connection.schemaRegistryConfig[
            "ssl.certificate.location"
        ] = self.cert_file_path
        return connection


@singledispatch
def check_ssl_and_init(connection):
    return connection


@check_ssl_and_init.register(MysqlConnection)
@check_ssl_and_init.register(DorisConnection)
def _(connection):
    service_connection = cast(Union[MysqlConnection, DorisConnection], connection)
    ssl: Optional[verifySSLConfig.SslConfig] = service_connection.sslConfig
    if ssl and (
        ssl.__root__.caCertificate or ssl.__root__.sslCertificate or ssl.__root__.sslKey
    ):
        return SSLManager(
            ca=ssl.__root__.caCertificate,
            cert=ssl.__root__.sslCertificate,
            key=ssl.__root__.sslKey,
        )
    return None


@check_ssl_and_init.register(PostgresConnection)
@check_ssl_and_init.register(RedshiftConnection)
@check_ssl_and_init.register(GreenplumConnection)
def _(connection):
    connection = cast(
        Union[PostgresConnection, RedshiftConnection, GreenplumConnection],
        connection,
    )
    if connection.sslMode and connection.sslConfig:
        return SSLManager(ca=connection.sslConfig.__root__.caCertificate)

    return None
