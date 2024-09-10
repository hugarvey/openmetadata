/*
 *  Copyright 2024 Collate.
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
import { uuid } from '../utils/common';
import { GlobalSettingOptions } from './settings';

export const SERVICE_TYPE = {
  Database: GlobalSettingOptions.DATABASES,
  Messaging: GlobalSettingOptions.MESSAGING,
  Dashboard: GlobalSettingOptions.DASHBOARDS,
  Pipeline: GlobalSettingOptions.PIPELINES,
  MLModels: GlobalSettingOptions.MLMODELS,
  Storage: GlobalSettingOptions.STORAGES,
  Search: GlobalSettingOptions.SEARCH,
  Metadata: GlobalSettingOptions.METADATA,
  StoredProcedure: GlobalSettingOptions.STORED_PROCEDURES,
  ApiService: GlobalSettingOptions.APIS,
};

export const SERVICE_CATEGORIES = {
  DATABASE_SERVICES: 'databaseServices',
  MESSAGING_SERVICES: 'messagingServices',
  PIPELINE_SERVICES: 'pipelineServices',
  DASHBOARD_SERVICES: 'dashboardServices',
  ML_MODEL_SERVICES: 'mlmodelServices',
  STORAGE_SERVICES: 'storageServices',
  METADATA_SERVICES: 'metadataServices',
  SEARCH_SERVICES: 'searchServices',
};

export const VISIT_SERVICE_PAGE_DETAILS = {
  [SERVICE_TYPE.Database]: {
    settingsMenuId: GlobalSettingOptions.DATABASES,
    serviceCategory: SERVICE_CATEGORIES.DATABASE_SERVICES,
  },
  [SERVICE_TYPE.Messaging]: {
    settingsMenuId: GlobalSettingOptions.MESSAGING,
    serviceCategory: SERVICE_CATEGORIES.MESSAGING_SERVICES,
  },
  [SERVICE_TYPE.Dashboard]: {
    settingsMenuId: GlobalSettingOptions.DASHBOARDS,
    serviceCategory: SERVICE_CATEGORIES.DASHBOARD_SERVICES,
  },
  [SERVICE_TYPE.Pipeline]: {
    settingsMenuId: GlobalSettingOptions.PIPELINES,
    serviceCategory: SERVICE_CATEGORIES.PIPELINE_SERVICES,
  },
  [SERVICE_TYPE.MLModels]: {
    settingsMenuId: GlobalSettingOptions.MLMODELS,
    serviceCategory: SERVICE_CATEGORIES.ML_MODEL_SERVICES,
  },
  [SERVICE_TYPE.Storage]: {
    settingsMenuId: GlobalSettingOptions.STORAGES,
    serviceCategory: SERVICE_CATEGORIES.STORAGE_SERVICES,
  },
  [SERVICE_TYPE.Search]: {
    settingsMenuId: GlobalSettingOptions.SEARCH,
    serviceCategory: SERVICE_CATEGORIES.SEARCH_SERVICES,
  },
  [SERVICE_TYPE.Metadata]: {
    settingsMenuId: GlobalSettingOptions.METADATA,
    serviceCategory: SERVICE_CATEGORIES.METADATA_SERVICES,
  },
};

const uniqueID = uuid();

export const REDSHIFT = {
  serviceType: 'Redshift',
  serviceName: `redshift-ct-test-with-%-${uniqueID}`,
  tableName: 'raw_payments',
  DBTTable: 'customers',
  description: `This is Redshift-ct-test-${uniqueID} description`,
};

export const POSTGRES = {
  serviceType: 'Postgres',
  serviceName: `pw-postgres-test-with-%-${uniqueID}`,
  tableName: 'order_items',
};

export const MYSQL = 'Mysql';

export const HTTP_CONFIG_SOURCE = {
  DBT_CATALOG_HTTP_PATH:
    'https://raw.githubusercontent.com/OnkarVO7/dbt_git_test/dbt_aut/catalog.json',
  DBT_MANIFEST_HTTP_PATH:
    'https://raw.githubusercontent.com/OnkarVO7/dbt_git_test/dbt_aut/manifest.json',
  DBT_RUN_RESULTS_FILE_PATH:
    'https://raw.githubusercontent.com/OnkarVO7/dbt_git_test/dbt_aut/run_results.json',
};

export const DBT = {
  classification: 'dbtTags',
  tagName: 'model_tag_two',
  dbtQuery: 'select * from "dev"."dbt_automate_upgrade_tests"."stg_orders"',
  dbtLineageNodeLabel: 'customers',
  dbtLineageNode: 'dev.dbt_automate_upgrade_tests.stg_customers',
  dataQualityTest1: 'unique_customers_customer_id',
  dataQualityTest2: 'not_null_customers_customer_id',
};
