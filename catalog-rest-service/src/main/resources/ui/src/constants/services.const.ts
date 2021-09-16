/*
  * Licensed to the Apache Software Foundation (ASF) under one or more
  * contributor license agreements. See the NOTICE file distributed with
  * this work for additional information regarding copyright ownership.
  * The ASF licenses this file to You under the Apache License, Version 2.0
  * (the "License"); you may not use this file except in compliance with
  * the License. You may obtain a copy of the License at

  * http://www.apache.org/licenses/LICENSE-2.0

  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
*/

import { ServiceTypes } from 'Models';
import noService from '../assets/img/no-service.png';
import athena from '../assets/img/service-icon-athena.png';
import serviceDefault from '../assets/img/service-icon-generic.png';
import hive from '../assets/img/service-icon-hive.png';
import kafka from '../assets/img/service-icon-kafka.png';
import looker from '../assets/img/service-icon-looker.png';
import mssql from '../assets/img/service-icon-mssql.png';
import oracle from '../assets/img/service-icon-oracle.png';
import postgres from '../assets/img/service-icon-post.png';
import presto from '../assets/img/service-icon-presto.png';
import pulsar from '../assets/img/service-icon-pulsar.png';
import query from '../assets/img/service-icon-query.png';
import redash from '../assets/img/service-icon-redash.png';
import redshift from '../assets/img/service-icon-redshift.png';
import snowflakes from '../assets/img/service-icon-snowflakes.png';
import mysql from '../assets/img/service-icon-sql.png';
import superset from '../assets/img/service-icon-superset.png';
import tableau from '../assets/img/service-icon-tableau.png';
import plus from '../assets/svg/plus.svg';
import { ServiceCategory } from '../enums/service.enum';

export const MYSQL = mysql;
export const MSSQL = mssql;
export const REDSHIFT = redshift;
export const BIGQUERY = query;
export const HIVE = hive;
export const POSTGRES = postgres;
export const ORACLE = oracle;
export const SNOWFLAKE = snowflakes;
export const ATHENA = athena;
export const PRESTO = presto;
export const KAFKA = kafka;
export const PULSAR = pulsar;
export const SUPERSET = superset;
export const LOOKER = looker;
export const TABLEAU = tableau;
export const REDASH = redash;
export const SERVICE_DEFAULT = serviceDefault;

export const PLUS = plus;
export const NOSERVICE = noService;

export const serviceTypes: Record<ServiceTypes, Array<string>> = {
  databaseServices: [
    'BigQuery',
    'MySQL',
    'Redshift',
    'Snowflake',
    'Postgres',
    'MSSQL',
    'Hive',
    'Oracle',
    'Athena',
    'Presto',
  ],
  messagingServices: ['Kafka'],
  dashboardServices: ['Superset', 'Looker', 'Tableau'],
};

export const arrServiceTypes: Array<ServiceTypes> = [
  'databaseServices',
  'messagingServices',
  'dashboardServices',
];

export const servicesDisplayName = {
  databaseServices: 'Database Service',
  messagingServices: 'Messaging Service',
  dashboardServices: 'Dashboard Service',
};

export const routeServiceTypes = [
  {
    param: 'database',
    type: ServiceCategory.DATABASE_SERVICES,
  },
  {
    param: 'messaging',
    type: ServiceCategory.MESSAGING_SERVICES,
  },
];
