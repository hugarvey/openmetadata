/*
 *  Copyright 2023 Collate.
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

import { Col, Row, Space, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import PageLayoutV1 from 'components/containers/PageLayoutV1';
import DataAssetsVersionHeader from 'components/DataAssets/DataAssetsVersionHeader/DataAssetsVersionHeader';
import EntityVersionTimeLine from 'components/Entity/EntityVersionTimeLine/EntityVersionTimeLine';
import Loader from 'components/Loader/Loader';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from 'components/PermissionProvider/PermissionProvider.interface';
import TabsLabel from 'components/TabsLabel/TabsLabel.component';
import TagsContainerV2 from 'components/Tag/TagsContainerV2/TagsContainerV2';
import { DisplayType } from 'components/Tag/TagsViewer/TagsViewer.interface';
import {
  getDatabaseSchemaDetailsPath,
  INITIAL_PAGING_VALUE,
} from 'constants/constants';
import { EntityField } from 'constants/Feeds.constants';
import { ERROR_PLACEHOLDER_TYPE } from 'enums/common.enum';
import { EntityTabs, EntityType } from 'enums/entity.enum';
import { DatabaseSchema } from 'generated/entity/data/databaseSchema';
import { Table } from 'generated/entity/data/table';
import { ChangeDescription } from 'generated/entity/type';
import { EntityHistory } from 'generated/type/entityHistory';
import { TagSource } from 'generated/type/tagLabel';
import { isEmpty, isString, toString } from 'lodash';
import { PagingResponse } from 'Models';
import SchemaTablesTab from 'pages/DatabaseSchemaPage/SchemaTablesTab';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import {
  getDatabaseSchemaDetailsByFQN,
  getDatabaseSchemaVersionData,
  getDatabaseSchemaVersions,
} from 'rest/databaseAPI';
import { getTableList, TableListParams } from 'rest/tableAPI';
import { getEntityBreadcrumbs, getEntityName } from 'utils/EntityUtils';
import {
  getCommonExtraInfoForVersionDetails,
  getEntityVersionByField,
  getEntityVersionTags,
} from 'utils/EntityVersionUtils';
import { DEFAULT_ENTITY_PERMISSION } from 'utils/PermissionsUtils';
import { getDatabaseSchemaVersionPath } from 'utils/RouterUtils';
import { getDecodedFqn } from 'utils/StringsUtils';
import { getTierTags } from 'utils/TableUtils';

function DatabaseSchemaVersionPage() {
  const { t } = useTranslation();
  const history = useHistory();
  const { getEntityPermissionByFqn } = usePermissionProvider();
  const { databaseSchemaFQN, version } = useParams<{
    databaseSchemaFQN: string;
    version: string;
  }>();
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGING_VALUE);
  const [tableData, setTableData] = useState<PagingResponse<Table[]>>({
    data: [],
    paging: { total: 0 },
  });
  const [servicePermissions, setServicePermissions] =
    useState<OperationPermission>(DEFAULT_ENTITY_PERMISSION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVersionDataLoading, setIsVersionDataLoading] =
    useState<boolean>(true);
  const [isTableDataLoading, setIsTableDataLoading] = useState<boolean>(true);
  const [databaseId, setDatabaseId] = useState<string>('');
  const [currentVersionData, setCurrentVersionData] = useState<DatabaseSchema>(
    {} as DatabaseSchema
  );
  const [versionList, setVersionList] = useState<EntityHistory>(
    {} as EntityHistory
  );

  const changeDescription = useMemo(
    () => currentVersionData.changeDescription ?? ({} as ChangeDescription),
    [currentVersionData]
  );
  const { deleted } = useMemo(() => {
    return {
      deleted: Boolean(currentVersionData.deleted),
    };
  }, [currentVersionData]);

  const viewVersionPermission = useMemo(
    () => servicePermissions.ViewAll || servicePermissions.ViewBasic,
    [servicePermissions]
  );

  const tier = useMemo(
    () => getTierTags(currentVersionData.tags ?? []),
    [currentVersionData]
  );
  const owner = useMemo(() => currentVersionData.owner, [currentVersionData]);

  const breadcrumbLinks = useMemo(
    () => getEntityBreadcrumbs(currentVersionData, EntityType.DATABASE_SCHEMA),
    [currentVersionData]
  );

  const { ownerDisplayName, ownerRef, tierDisplayName } = useMemo(
    () =>
      getCommonExtraInfoForVersionDetails(
        currentVersionData.changeDescription as ChangeDescription,
        owner,
        tier
      ),
    [currentVersionData.changeDescription, owner, tier]
  );

  const fetchResourcePermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const permission = await getEntityPermissionByFqn(
        ResourceEntity.DATABASE,
        databaseSchemaFQN
      );

      setServicePermissions(permission);
    } finally {
      setIsLoading(false);
    }
  }, [databaseSchemaFQN, getEntityPermissionByFqn, setServicePermissions]);

  const fetchVersionsList = useCallback(async () => {
    try {
      setIsLoading(true);

      const { id } = await getDatabaseSchemaDetailsByFQN(databaseSchemaFQN, '');
      setDatabaseId(id ?? '');

      const versions = await getDatabaseSchemaVersions(id ?? '');

      setVersionList(versions);
    } finally {
      setIsLoading(false);
    }
  }, [viewVersionPermission, databaseSchemaFQN]);

  const fetchCurrentVersionData = useCallback(
    async (id: string) => {
      try {
        setIsVersionDataLoading(true);
        if (viewVersionPermission) {
          const response = await getDatabaseSchemaVersionData(id, version);

          setCurrentVersionData(response);
        }
      } finally {
        setIsVersionDataLoading(false);
      }
    },
    [viewVersionPermission, version]
  );

  const getSchemaTables = useCallback(
    async (params?: TableListParams) => {
      setIsTableDataLoading(true);
      try {
        const res = await getTableList({
          ...params,
          databaseSchema: getDecodedFqn(databaseSchemaFQN),
        });
        setTableData(res);
      } finally {
        setIsTableDataLoading(false);
      }
    },
    [databaseSchemaFQN]
  );

  const displayName = useMemo(() => {
    return getEntityVersionByField(
      changeDescription,
      EntityField.DISPLAYNAME,
      currentVersionData.displayName
    );
  }, [currentVersionData, changeDescription]);

  const tags = useMemo(() => {
    return getEntityVersionTags(currentVersionData, changeDescription);
  }, [currentVersionData, changeDescription]);

  const description = useMemo(() => {
    return getEntityVersionByField(
      changeDescription,
      EntityField.DESCRIPTION,
      currentVersionData.description
    );
  }, [currentVersionData, changeDescription]);

  const tablePaginationHandler = useCallback(
    (cursorValue: string | number, activePage?: number) => {
      if (isString(cursorValue)) {
        getSchemaTables({ [cursorValue]: tableData.paging[cursorValue] });
      }
      setCurrentPage(activePage ?? INITIAL_PAGING_VALUE);
    },
    [tableData, getSchemaTables]
  );

  const versionHandler = useCallback(
    (newVersion = version) => {
      history.push(
        getDatabaseSchemaVersionPath(databaseSchemaFQN, toString(newVersion))
      );
    },
    [databaseSchemaFQN]
  );

  const backHandler = useCallback(() => {
    history.push(getDatabaseSchemaDetailsPath(databaseSchemaFQN));
  }, [databaseSchemaFQN]);

  const tabs: TabsProps['items'] = useMemo(
    () => [
      {
        label: (
          <TabsLabel id={EntityTabs.TABLE} name={t('label.table-plural')} />
        ),
        key: EntityTabs.TABLE,
        children: (
          <Row gutter={[0, 16]} wrap={false}>
            <Col className="p-t-sm m-x-lg" flex="auto">
              <SchemaTablesTab
                isVersionView
                currentTablesPage={currentPage}
                databaseSchemaDetails={currentVersionData}
                description={description}
                tableData={tableData}
                tableDataLoading={isTableDataLoading}
                tablePaginationHandler={tablePaginationHandler}
              />
            </Col>
            <Col
              className="entity-tag-right-panel-container"
              data-testid="entity-right-panel"
              flex="220px">
              <Space className="w-full" direction="vertical" size="large">
                {Object.keys(TagSource).map((tagType) => (
                  <TagsContainerV2
                    displayType={DisplayType.READ_MORE}
                    entityFqn={databaseSchemaFQN}
                    entityType={EntityType.DATABASE_SCHEMA}
                    key={tagType}
                    permission={false}
                    selectedTags={tags}
                    showTaskHandler={false}
                    tagType={TagSource[tagType as TagSource]}
                  />
                ))}
              </Space>
            </Col>
          </Row>
        ),
      },
    ],
    [
      currentPage,
      currentVersionData,
      description,
      tableData,
      isTableDataLoading,
      tablePaginationHandler,
      databaseSchemaFQN,
      tags,
    ]
  );

  const versionComponent = () => {
    if (isLoading) {
      return <Loader />;
    }

    if (!viewVersionPermission) {
      return <ErrorPlaceHolder type={ERROR_PLACEHOLDER_TYPE.PERMISSION} />;
    }

    return (
      <>
        {isVersionDataLoading ? (
          <Loader />
        ) : (
          <div className={classNames('version-data')}>
            <Row gutter={[0, 12]}>
              <Col span={24}>
                <DataAssetsVersionHeader
                  breadcrumbLinks={breadcrumbLinks}
                  currentVersionData={currentVersionData}
                  deleted={deleted}
                  displayName={displayName}
                  entityType={EntityType.DATABASE}
                  ownerDisplayName={ownerDisplayName}
                  ownerRef={ownerRef}
                  tierDisplayName={tierDisplayName}
                  version={version}
                  onVersionClick={backHandler}
                />
              </Col>
              <Col span={24}>
                <Tabs
                  className="entity-details-page-tabs"
                  data-testid="tabs"
                  items={tabs}
                />
              </Col>
            </Row>
          </div>
        )}

        <EntityVersionTimeLine
          currentVersion={toString(version)}
          versionHandler={versionHandler}
          versionList={versionList}
          onBack={backHandler}
        />
      </>
    );
  };

  useEffect(() => {
    if (!isEmpty(databaseSchemaFQN)) {
      fetchResourcePermission();
    }
  }, [databaseSchemaFQN]);

  useEffect(() => {
    if (viewVersionPermission) {
      fetchVersionsList();
    }
  }, [databaseSchemaFQN, viewVersionPermission]);

  useEffect(() => {
    if (databaseId) {
      fetchCurrentVersionData(databaseId);
    }
  }, [version, databaseId]);

  useEffect(() => {
    if (!isEmpty(currentVersionData)) {
      getSchemaTables();
    }
  }, [currentVersionData]);

  return (
    <PageLayoutV1
      className="version-page-container"
      pageTitle={t('label.entity-version-detail-plural', {
        entity: getEntityName(currentVersionData),
      })}>
      {versionComponent()}
    </PageLayoutV1>
  );
}

export default DatabaseSchemaVersionPage;
