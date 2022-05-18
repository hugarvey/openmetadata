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
 * Mysql Database Connection Config
 */
export interface MysqlConnection {
  connectionArguments?: { [key: string]: any };
  connectionOptions?: { [key: string]: string };
  /**
   * Database of the data source. This is optional parameter, if you would like to restrict
   * the metadata reading to a single database. When left blank, OpenMetadata Ingestion
   * attempts to scan all the databases.
   */
  database?: string;
  /**
   * Host and port of the MySQL service.
   */
  hostPort: string;
  /**
   * Password to connect to MySQL.
   */
  password?: string;
  /**
   * SQLAlchemy driver scheme options.
   */
  scheme?: MySQLScheme;
  supportsMetadataExtraction?: boolean;
  supportsProfiler?: boolean;
  /**
   * Service Type
   */
  type?: MySQLType;
  /**
   * Username to connect to MySQL. This user should have privileges to read all the metadata
   * in Mysql.
   */
  username: string;
}

/**
 * SQLAlchemy driver scheme options.
 */
export enum MySQLScheme {
  MysqlPymysql = 'mysql+pymysql',
}

/**
 * Service Type
 *
 * Service type.
 */
export enum MySQLType {
  Mysql = 'Mysql',
}
