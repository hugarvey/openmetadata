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
import React, { useMemo } from 'react';
import { Route, useParams } from 'react-router-dom';
import { ROUTES } from '../../constants/constants';
import { EntityType } from '../../enums/entity.enum';
import withSuspenseFallback from './withSuspenseFallback';

const TableDetailsPageV1 = withSuspenseFallback(
  React.lazy(() => import('../../pages/TableDetailsPageV1/TableDetailsPageV1'))
);

const PipelineDetailsPage = withSuspenseFallback(
  React.lazy(
    () => import('../../pages/PipelineDetails/PipelineDetailsPage.component')
  )
);

const TopicDetailsPage = withSuspenseFallback(
  React.lazy(
    () => import('../../pages/TopicDetails/TopicDetailsPage.component')
  )
);

const DashboardDetailsPage = withSuspenseFallback(
  React.lazy(
    () =>
      import('../../pages/DashboardDetailsPage/DashboardDetailsPage.component')
  )
);
const DatabaseDetails = withSuspenseFallback(
  React.lazy(
    () => import('../../pages/DatabaseDetailsPage/DatabaseDetailsPage')
  )
);
const DatabaseSchemaPageComponent = withSuspenseFallback(
  React.lazy(
    () => import('../../pages/DatabaseSchemaPage/DatabaseSchemaPage.component')
  )
);

const DataModelDetailsPage = withSuspenseFallback(
  React.lazy(() => import('../../pages/DataModelPage/DataModelPage.component'))
);

const StoredProcedureDetailsPage = withSuspenseFallback(
  React.lazy(() => import('../../pages/StoredProcedure/StoredProcedurePage'))
);

const EntityVersionPage = withSuspenseFallback(
  React.lazy(
    () => import('../../pages/EntityVersionPage/EntityVersionPage.component')
  )
);

const MlModelPage = withSuspenseFallback(
  React.lazy(() => import('../../pages/MlModelPage/MlModelPage.component'))
);

const ContainerPage = withSuspenseFallback(
  React.lazy(() => import('../../pages/ContainerPage/ContainerPage'))
);

const SearchIndexDetailsPage = withSuspenseFallback(
  React.lazy(
    () => import('../../pages/SearchIndexDetailsPage/SearchIndexDetailsPage')
  )
);

export const EntityRouter = () => {
  const { entityType } = useParams<{ entityType: EntityType }>();

  const Component = useMemo(() => {
    switch (entityType) {
      case EntityType.TABLE:
      default:
        return TableDetailsPageV1;
      case EntityType.DATABASE:
        return DatabaseDetails;
      case EntityType.DATABASE_SCHEMA:
        return DatabaseSchemaPageComponent;
      case EntityType.PIPELINE:
        return PipelineDetailsPage;
      case EntityType.TOPIC:
        return TopicDetailsPage;
      case EntityType.DASHBOARD:
        return DashboardDetailsPage;
      case EntityType.STORED_PROCEDURE:
        return StoredProcedureDetailsPage;
      case EntityType.DASHBOARD_DATA_MODEL:
        return DataModelDetailsPage;
      case EntityType.MLMODEL:
        return MlModelPage;
      case EntityType.CONTAINER:
        return ContainerPage;
      case EntityType.SEARCH_INDEX:
        return SearchIndexDetailsPage;
    }
  }, [entityType]);

  return (
    <>
      <Route
        exact
        component={EntityVersionPage}
        path={ROUTES.ENTITY_VERSION_DETAILS}
      />
      <Route
        component={Component}
        path={[
          ROUTES.ENTITY_DETAILS_WITH_SUB_TAB,
          ROUTES.ENTITY_DETAILS_WITH_TAB,
          ROUTES.ENTITY_DETAILS,
        ]}
      />
    </>
  );
};
