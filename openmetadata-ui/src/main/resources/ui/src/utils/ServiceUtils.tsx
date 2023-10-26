/*
 *  Copyright 2022 Collate.
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

import { AxiosError } from 'axios';
import cryptoRandomString from 'crypto-random-string-with-promisify-polyfill';
import { t } from 'i18next';
import { ServiceTypes } from 'Models';
import React from 'react';
import { ResourceEntity } from '../components/PermissionProvider/PermissionProvider.interface';
import { GlobalSettingOptions } from '../constants/GlobalSettings.constants';
import {
  SERVICE_TYPES_ENUM,
  SERVICE_TYPE_MAP,
} from '../constants/Services.constant';
import { PROMISE_STATE } from '../enums/common.enum';
import { EntityType } from '../enums/entity.enum';
import { SearchIndex } from '../enums/search.enum';
import { ServiceCategory } from '../enums/service.enum';
import { StorageServiceType } from '../generated/entity/data/container';
import { Database } from '../generated/entity/data/database';
import { MlModelServiceType } from '../generated/entity/data/mlmodel';
import {
  DashboardService,
  DashboardServiceType,
} from '../generated/entity/services/dashboardService';
import { DatabaseServiceType } from '../generated/entity/services/databaseService';
import { PipelineType as IngestionPipelineType } from '../generated/entity/services/ingestionPipelines/ingestionPipeline';
import {
  MessagingService,
  MessagingServiceType,
} from '../generated/entity/services/messagingService';
import { MlmodelService } from '../generated/entity/services/mlmodelService';
import {
  PipelineService,
  PipelineServiceType,
} from '../generated/entity/services/pipelineService';
import { ServicesType } from '../interface/service.interface';
import { getEntityCount } from '../rest/miscAPI';
import {
  getEntityDeleteMessage,
  pluralize,
  replaceAllSpacialCharWith_,
} from './CommonUtils';
import { getDashboardURL } from './DashboardServiceUtils';
import { getBrokers } from './MessagingServiceUtils';
import { getEncodedFqn } from './StringsUtils';
import { getEntityLink } from './TableUtils';
import { showErrorToast } from './ToastUtils';

export const getFormattedGuideText = (
  text: string,
  toReplace: string,
  replacement: string,
  isGlobal = false
) => {
  const regExp = isGlobal ? new RegExp(toReplace, 'g') : new RegExp(toReplace);

  return text.replace(regExp, replacement);
};

export const getIngestionName = (
  serviceName: string,
  type: IngestionPipelineType
) => {
  if (
    [
      IngestionPipelineType.Profiler,
      IngestionPipelineType.Metadata,
      IngestionPipelineType.Lineage,
      IngestionPipelineType.Dbt,
    ].includes(type)
  ) {
    return `${replaceAllSpacialCharWith_(
      serviceName
    )}_${type}_${cryptoRandomString({
      length: 8,
      type: 'alphanumeric',
    })}`;
  } else {
    return `${serviceName}_${type}`;
  }
};

export const shouldTestConnection = (serviceType: string) => {
  return (
    serviceType !== DatabaseServiceType.CustomDatabase &&
    serviceType !== MessagingServiceType.CustomMessaging &&
    serviceType !== DashboardServiceType.CustomDashboard &&
    serviceType !== MlModelServiceType.CustomMlModel &&
    serviceType !== PipelineServiceType.CustomPipeline &&
    serviceType !== StorageServiceType.CustomStorage
  );
};

export const getServiceType = (serviceCat: ServiceCategory) =>
  SERVICE_TYPE_MAP[serviceCat];

export const getServiceTypesFromServiceCategory = (
  serviceCat: ServiceCategory
) => {
  return SERVICE_TYPES_ENUM[serviceCat];
};

export const getServiceCreatedLabel = (serviceCategory: ServiceCategory) => {
  let serviceCat;
  switch (serviceCategory) {
    case ServiceCategory.DATABASE_SERVICES:
      serviceCat = t('label.database-lowercase');

      break;
    case ServiceCategory.MESSAGING_SERVICES:
      serviceCat = t('label.messaging-lowercase');

      break;
    case ServiceCategory.DASHBOARD_SERVICES:
      serviceCat = t('label.dashboard-lowercase');

      break;

    case ServiceCategory.PIPELINE_SERVICES:
      serviceCat = t('label.pipeline-lowercase');

      break;
    default:
      serviceCat = '';

      break;
  }

  return [serviceCat, t('label.service-lowercase')].join(' ');
};

export const setServiceSchemaCount = (
  data: Database[],
  callback: (value: React.SetStateAction<number>) => void
) => {
  const promises = data.map((database) =>
    getEntityCount('databaseSchemas', database.fullyQualifiedName)
  );

  Promise.allSettled(promises)
    .then((results) => {
      let count = 0;
      results.forEach((result) => {
        if (result.status === PROMISE_STATE.FULFILLED) {
          count += result.value?.paging?.total || 0;
        }
      });
      callback(count);
    })
    .catch((err: AxiosError) => showErrorToast(err));
};

export const setServiceTableCount = (
  data: Database[],
  callback: (value: React.SetStateAction<number>) => void
) => {
  const promises = data.map((database) =>
    getEntityCount('tables', database.fullyQualifiedName)
  );

  Promise.allSettled(promises)
    .then((results) => {
      let count = 0;
      results.forEach((result) => {
        if (result.status === PROMISE_STATE.FULFILLED) {
          count += result.value?.paging?.total || 0;
        }
      });
      callback(count);
    })
    .catch((err: AxiosError) => showErrorToast(err));
};

export const getOptionalFields = (
  service: ServicesType,
  serviceName: ServiceCategory
): JSX.Element => {
  switch (serviceName) {
    case ServiceCategory.MESSAGING_SERVICES: {
      const messagingService = service as MessagingService;

      return (
        <div className="m-b-xss truncate" data-testid="additional-field">
          <label className="m-b-0">{t('label.broker-plural')}:</label>
          <span
            className="m-l-xss font-normal text-grey-body"
            data-testid="brokers">
            {getBrokers(messagingService.connection?.config)}
          </span>
        </div>
      );
    }
    case ServiceCategory.DASHBOARD_SERVICES: {
      const dashboardService = service as DashboardService;

      return (
        <div className="m-b-xss truncate" data-testid="additional-field">
          <label className="m-b-0">{t('label.url-uppercase')}:</label>
          <span
            className="m-l-xss font-normal text-grey-body"
            data-testid="dashboard-url">
            {getDashboardURL(dashboardService.connection?.config)}
          </span>
        </div>
      );
    }
    case ServiceCategory.PIPELINE_SERVICES: {
      const pipelineService = service as PipelineService;

      return (
        <div className="m-b-xss truncate" data-testid="additional-field">
          <label className="m-b-0">{t('label.url-uppercase')}:</label>
          <span
            className="m-l-xss font-normal text-grey-body"
            data-testid="pipeline-url">
            {pipelineService.connection?.config?.hostPort || '--'}
          </span>
        </div>
      );
    }

    case ServiceCategory.ML_MODEL_SERVICES: {
      const mlmodel = service as MlmodelService;

      return (
        <>
          <div className="m-b-xss truncate" data-testid="additional-field">
            <label className="m-b-0">{t('label.registry')}:</label>
            <span
              className="m-l-xss font-normal text-grey-body"
              data-testid="pipeline-url">
              {mlmodel.connection?.config?.registryUri || '--'}
            </span>
          </div>
          <div className="m-b-xss truncate" data-testid="additional-field">
            <label className="m-b-0">{t('label.tracking')}:</label>
            <span
              className="m-l-xss font-normal text-grey-body"
              data-testid="pipeline-url">
              {mlmodel.connection?.config?.trackingUri || '--'}
            </span>
          </div>
        </>
      );
    }
    default: {
      return <></>;
    }
  }
};

export const getDeleteEntityMessage = (
  serviceName: string,
  instanceCount: number,
  schemaCount: number,
  tableCount: number
) => {
  const service = serviceName?.slice(0, -1);

  switch (serviceName) {
    case ServiceCategory.DATABASE_SERVICES:
      return getEntityDeleteMessage(
        service || t('label.service'),
        `${pluralize(instanceCount, t('label.database'))}, ${pluralize(
          schemaCount,
          t('label.schema')
        )} ${t('label.and-lowercase')} ${pluralize(
          tableCount,
          t('label.table')
        )}`
      );

    case ServiceCategory.MESSAGING_SERVICES:
      return getEntityDeleteMessage(
        service || t('label.service'),
        pluralize(instanceCount, t('label.topic'))
      );

    case ServiceCategory.DASHBOARD_SERVICES:
      return getEntityDeleteMessage(
        service || t('label.service'),
        pluralize(instanceCount, t('label.dashboard'))
      );

    case ServiceCategory.PIPELINE_SERVICES:
      return getEntityDeleteMessage(
        service || t('label.service'),
        pluralize(instanceCount, t('label.pipeline'))
      );

    case ServiceCategory.METADATA_SERVICES:
      return getEntityDeleteMessage(
        service || t('label.service'),
        pluralize(instanceCount, t('label.metadata'))
      );

    case ServiceCategory.STORAGE_SERVICES:
      return getEntityDeleteMessage(
        service || t('label.service'),
        pluralize(instanceCount, t('label.container'))
      );

    default:
      return;
  }
};

export const getServiceRouteFromServiceType = (type: ServiceTypes) => {
  if (type === 'messagingServices') {
    return GlobalSettingOptions.MESSAGING;
  }
  if (type === 'dashboardServices') {
    return GlobalSettingOptions.DASHBOARDS;
  }
  if (type === 'pipelineServices') {
    return GlobalSettingOptions.PIPELINES;
  }
  if (type === 'mlmodelServices') {
    return GlobalSettingOptions.MLMODELS;
  }
  if (type === 'metadataServices') {
    return GlobalSettingOptions.METADATA;
  }
  if (type === 'storageServices') {
    return GlobalSettingOptions.STORAGES;
  }
  if (type === 'searchServices') {
    return GlobalSettingOptions.SEARCH;
  }

  return GlobalSettingOptions.DATABASES;
};

export const getResourceEntityFromServiceCategory = (
  category: string | ServiceCategory
) => {
  switch (category) {
    case 'dashboards':
    case ServiceCategory.DASHBOARD_SERVICES:
      return ResourceEntity.DASHBOARD_SERVICE;

    case 'databases':
    case ServiceCategory.DATABASE_SERVICES:
      return ResourceEntity.DATABASE_SERVICE;

    case 'mlModels':
    case ServiceCategory.ML_MODEL_SERVICES:
      return ResourceEntity.ML_MODEL_SERVICE;

    case 'messaging':
    case ServiceCategory.MESSAGING_SERVICES:
      return ResourceEntity.MESSAGING_SERVICE;

    case 'pipelines':
    case ServiceCategory.PIPELINE_SERVICES:
      return ResourceEntity.PIPELINE_SERVICE;

    case 'metadata':
    case ServiceCategory.METADATA_SERVICES:
      return ResourceEntity.METADATA_SERVICE;

    case 'storageServices':
    case ServiceCategory.STORAGE_SERVICES:
      return ResourceEntity.STORAGE_SERVICE;
  }

  return ResourceEntity.DATABASE_SERVICE;
};

export const getCountLabel = (serviceName: ServiceTypes) => {
  switch (serviceName) {
    case ServiceCategory.DASHBOARD_SERVICES:
      return t('label.dashboard-plural');
    case ServiceCategory.MESSAGING_SERVICES:
      return t('label.topic-plural');
    case ServiceCategory.PIPELINE_SERVICES:
      return t('label.pipeline-plural');
    case ServiceCategory.ML_MODEL_SERVICES:
      return t('label.ml-model-plural');
    case ServiceCategory.STORAGE_SERVICES:
      return t('label.container-plural');
    case ServiceCategory.SEARCH_SERVICES:
      return t('label.search-index-plural');
    case ServiceCategory.DATABASE_SERVICES:
    default:
      return t('label.database-plural');
  }
};

export const getTestConnectionName = (connectionType: string) => {
  return `test-connection-${connectionType}-${cryptoRandomString({
    length: 8,
    type: 'alphanumeric',
  })}`;
};

export const getServiceCategoryFromEntityType = (
  entityType: EntityType
): string => {
  switch (entityType) {
    case EntityType.DASHBOARD_SERVICE:
      return ServiceCategory.DASHBOARD_SERVICES;
    case EntityType.MESSAGING_SERVICE:
      return ServiceCategory.MESSAGING_SERVICES;
    case EntityType.PIPELINE_SERVICE:
      return ServiceCategory.PIPELINE_SERVICES;
    case EntityType.MLMODEL_SERVICE:
      return ServiceCategory.ML_MODEL_SERVICES;
    case EntityType.STORAGE_SERVICE:
      return ServiceCategory.STORAGE_SERVICES;
    case EntityType.DATABASE_SERVICE:
    default:
      return ServiceCategory.DATABASE_SERVICES;
  }
};

export const getEntityTypeFromServiceCategory = (
  serviceCategory: ServiceTypes
) => {
  switch (serviceCategory) {
    case ServiceCategory.DASHBOARD_SERVICES:
      return EntityType.DASHBOARD_SERVICE;
    case ServiceCategory.MESSAGING_SERVICES:
      return EntityType.MESSAGING_SERVICE;
    case ServiceCategory.PIPELINE_SERVICES:
      return EntityType.PIPELINE_SERVICE;
    case ServiceCategory.ML_MODEL_SERVICES:
      return EntityType.MLMODEL_SERVICE;
    case ServiceCategory.METADATA_SERVICES:
      return EntityType.METADATA_SERVICE;
    case ServiceCategory.STORAGE_SERVICES:
      return EntityType.STORAGE_SERVICE;
    case ServiceCategory.SEARCH_SERVICES:
      return EntityType.SEARCH_SERVICE;
    case ServiceCategory.DATABASE_SERVICES:
    default:
      return EntityType.DATABASE_SERVICE;
  }
};

export const getLinkForFqn = (serviceCategory: ServiceTypes, fqn: string) => {
  switch (serviceCategory) {
    case ServiceCategory.MESSAGING_SERVICES:
      return getEntityLink(SearchIndex.TOPIC, fqn);

    case ServiceCategory.DASHBOARD_SERVICES:
      return getEntityLink(SearchIndex.DASHBOARD, fqn);

    case ServiceCategory.PIPELINE_SERVICES:
      return getEntityLink(SearchIndex.PIPELINE, fqn);

    case ServiceCategory.ML_MODEL_SERVICES:
      return getEntityLink(SearchIndex.MLMODEL, fqn);

    case ServiceCategory.STORAGE_SERVICES:
      return getEntityLink(EntityType.CONTAINER, fqn);

    case ServiceCategory.SEARCH_SERVICES:
      return getEntityLink(EntityType.SEARCH_INDEX, fqn);

    case ServiceCategory.DATABASE_SERVICES:
    default:
      return `/database/${getEncodedFqn(fqn)}`;
  }
};
