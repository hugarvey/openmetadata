/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

/**
 * SingleStore Database Connection Config
 */
export interface SingleStoreConnection {
  connectionArguments?: ConnectionArguments;
  connectionOptions?: { [key: string]: any };
  /**
   * Database of the data source. This is optional parameter, if you would like to restrict
   * the metadata reading to a single database. When left blank , OpenMetadata Ingestion
   * attempts to scan all the databases in MySQL.
   */
  database?: string;
  /**
   * Host and port of the data source.
   */
  hostPort?: string;
  /**
   * password to connect  to the MYSQL.
   */
  password?: string;
  /**
   * SQLAlchemy driver scheme options.
   */
  scheme?: SingleStoreScheme;
  /**
   * Supported Metadata Extraction Pipelines.
   */
  supportedPipelineTypes?: string;
  /**
   * Service Type
   */
  type?: SingleStoreType;
  /**
   * username to connect  to the MySQL. This user should have privileges to read all the
   * metadata in MySQL.
   */
  username?: string;
}

/**
 * Additional connection arguments such as security or protocol configs that can be sent to
 * service during connection.
 */
export interface ConnectionArguments {
  /**
   * HTTP path of databricks cluster
   */
  http_path?: string;
}

/**
 * SQLAlchemy driver scheme options.
 */
export enum SingleStoreScheme {
  MysqlPymysql = 'mysql+pymysql',
}

/**
 * Service Type
 *
 * Service type.
 */
export enum SingleStoreType {
  SingleStore = 'SingleStore',
}
