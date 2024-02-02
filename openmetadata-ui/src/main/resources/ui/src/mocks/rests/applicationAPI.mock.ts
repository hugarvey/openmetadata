import { AppType } from '../../generated/entity/applications/app';
import {
  Permissions,
  ScheduleType,
} from '../../generated/entity/applications/marketplace/appMarketPlaceDefinition';
import { SearchIndexMappingLanguage } from '../../generated/settings/settings';

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
export const mockGetApplicationByNameResponse = {
  id: 'bfa9dee3-6737-4e82-b73b-2aef15420ba0',
  name: 'SearchIndexingApplication',
  displayName: 'Search Indexing',
  features: 'Sync OpenMetadata and Elastic Search and Recreate Indexes.',
  fullyQualifiedName: 'SearchIndexingApplication',
  version: 0.1,
  updatedAt: 1706768603545,
  updatedBy: 'admin',
  href: 'http://localhost:8585/api/v1/apps/bfa9dee3-6737-4e82-b73b-2aef15420ba0',
  deleted: false,
  provider: 'user',
  developer: 'Collate Inc.',
  developerUrl: 'https://www.getcollate.io',
  privacyPolicyUrl: 'https://www.getcollate.io',
  supportEmail: 'support@getcollate.io',
  className: 'org.openmetadata.service.apps.bundles.searchIndex.SearchIndexApp',
  appType: AppType.Internal,
  scheduleType: ScheduleType.Scheduled,
  permission: Permissions.All,
  bot: {
    id: '7afdf172-ba26-44b5-b2bd-4dfd6768f44c',
    type: 'bot',
    name: 'SearchIndexingApplicationBot',
    fullyQualifiedName: 'SearchIndexingApplicationBot',
    deleted: false,
  },
  runtime: {
    enabled: true,
  },
  allowConfiguration: true,
  appConfiguration: {
    entities: [
      'table',
      'dashboard',
      'topic',
      'pipeline',
      'searchIndex',
      'user',
      'team',
      'glossary',
      'glossaryTerm',
      'mlmodel',
      'tag',
      'classification',
      'query',
      'container',
      'database',
      'databaseSchema',
      'testCase',
      'testSuite',
      'chart',
      'dashboardDataModel',
      'databaseService',
      'messagingService',
      'dashboardService',
      'pipelineService',
      'mlmodelService',
      'searchService',
      'entityReportData',
      'webAnalyticEntityViewReportData',
      'webAnalyticUserActivityReportData',
      'domain',
      'storedProcedure',
      'dataProduct',
    ],
    batchSize: 100,
    recreateIndex: true,
    searchIndexMappingLanguage: SearchIndexMappingLanguage.En,
  },
  pipelines: [],
  appSchedule: {
    scheduleType: 'Custom',
    cronExpression: '0 0 0 1/1 * ? *',
  },
  appScreenshots: ['SearchIndexPic1.png'],
};
