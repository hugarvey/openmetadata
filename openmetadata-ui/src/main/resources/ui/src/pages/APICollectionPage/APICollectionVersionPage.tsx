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

import { Col, Row, Space, Tabs } from 'antd';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import { isEmpty, isUndefined, toString } from 'lodash';
import { PagingResponse } from 'Models';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { CustomPropertyTable } from '../../components/common/CustomPropertyTable/CustomPropertyTable';
import ErrorPlaceHolder from '../../components/common/ErrorWithPlaceholder/ErrorPlaceHolder';
import Loader from '../../components/common/Loader/Loader';
import { PagingHandlerParams } from '../../components/common/NextPrevious/NextPrevious.interface';
import TabsLabel from '../../components/common/TabsLabel/TabsLabel.component';
import DataAssetsVersionHeader from '../../components/DataAssets/DataAssetsVersionHeader/DataAssetsVersionHeader';
import DataProductsContainer from '../../components/DataProducts/DataProductsContainer/DataProductsContainer.component';
import EntityVersionTimeLine from '../../components/Entity/EntityVersionTimeLine/EntityVersionTimeLine';
import PageLayoutV1 from '../../components/PageLayoutV1/PageLayoutV1';
import TagsContainerV2 from '../../components/Tag/TagsContainerV2/TagsContainerV2';
import { DisplayType } from '../../components/Tag/TagsViewer/TagsViewer.interface';
import {
  getEntityDetailsPath,
  getVersionPath,
  INITIAL_PAGING_VALUE,
} from '../../constants/constants';
import { usePermissionProvider } from '../../context/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from '../../context/PermissionProvider/PermissionProvider.interface';
import { ERROR_PLACEHOLDER_TYPE } from '../../enums/common.enum';
import { EntityTabs, EntityType } from '../../enums/entity.enum';
import { APICollection } from '../../generated/entity/data/apiCollection';
import { APIEndpoint } from '../../generated/entity/data/apiEndpoint';
import { ChangeDescription } from '../../generated/entity/type';
import { EntityHistory } from '../../generated/type/entityHistory';
import { Include } from '../../generated/type/include';
import { TagSource } from '../../generated/type/tagLabel';
import { useFqn } from '../../hooks/useFqn';
import {
  getApiCollectionByFQN,
  getApiCollectionVersion,
  getApiCollectionVersions,
} from '../../rest/apiCollectionsAPI';
import {
  getApiEndPoints,
  GetApiEndPointsType,
} from '../../rest/apiEndpointsAPI';
import { getEntityName } from '../../utils/EntityUtils';
import {
  getBasicEntityInfoFromVersionData,
  getCommonDiffsFromVersionData,
  getCommonExtraInfoForVersionDetails,
} from '../../utils/EntityVersionUtils';
import { DEFAULT_ENTITY_PERMISSION } from '../../utils/PermissionsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import APIEndpointsTab from './APIEndpointsTab';

const APICollectionVersionPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { getEntityPermissionByFqn } = usePermissionProvider();
  const { version, tab } = useParams<{
    version: string;
    tab: EntityTabs;
  }>();

  const { fqn: decodedEntityFQN } = useFqn();

  const [collectionPermissions, setCollectionPermissions] =
    useState<OperationPermission>(DEFAULT_ENTITY_PERMISSION);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVersionDataLoading, setIsVersionDataLoading] =
    useState<boolean>(true);

  const [collection, setCollection] = useState<APICollection>();
  const [currentVersionData, setCurrentVersionData] = useState<APICollection>(
    {} as APICollection
  );
  const [versionList, setVersionList] = useState<EntityHistory>(
    {} as EntityHistory
  );

  const [apiEndpointsLoading, setAPIEndpointsLoading] = useState<boolean>(true);

  const [apiEndpoints, setAPIEndpoints] = useState<
    PagingResponse<APIEndpoint[]>
  >({
    data: [],
    paging: { total: 0 },
  });

  const [currentEndpointsPage, setCurrentEndpointsPage] =
    useState<number>(INITIAL_PAGING_VALUE);

  const { tier, owner, breadcrumbLinks, changeDescription, deleted, domain } =
    useMemo(
      () =>
        getBasicEntityInfoFromVersionData(
          currentVersionData,
          EntityType.API_COLLECTION
        ),
      [currentVersionData]
    );

  const viewVersionPermission = useMemo(
    () => collectionPermissions.ViewAll || collectionPermissions.ViewBasic,
    [collectionPermissions]
  );

  const { ownerDisplayName, ownerRef, tierDisplayName, domainDisplayName } =
    useMemo(
      () =>
        getCommonExtraInfoForVersionDetails(
          currentVersionData?.changeDescription as ChangeDescription,
          owner,
          tier,
          domain
        ),
      [currentVersionData?.changeDescription, owner, tier, domain]
    );

  const init = useCallback(async () => {
    try {
      setIsLoading(true);
      const permission = await getEntityPermissionByFqn(
        ResourceEntity.API_COLLECTION,
        decodedEntityFQN
      );
      setCollectionPermissions(permission);

      if (permission.ViewAll || permission.ViewBasic) {
        const collectionResponse = await getApiCollectionByFQN(
          decodedEntityFQN,
          {
            include: Include.All,
          }
        );
        setCollection(collectionResponse);

        const versions = await getApiCollectionVersions(
          collectionResponse.id ?? ''
        );

        setVersionList(versions);
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsLoading(false);
    }
  }, [decodedEntityFQN, getEntityPermissionByFqn]);

  const getAPICollectionEndpoints = useCallback(
    async (params?: Pick<GetApiEndPointsType, 'paging'>) => {
      if (isEmpty(collection)) {
        return;
      }

      setAPIEndpointsLoading(true);
      try {
        const res = await getApiEndPoints({
          ...params,
          fields: 'owner',
          apiCollection: collection?.fullyQualifiedName ?? '',
          service: collection?.service?.fullyQualifiedName ?? '',
          include: Include.All,
        });
        setAPIEndpoints(res);
      } catch (err) {
        showErrorToast(err as AxiosError);
      } finally {
        setAPIEndpointsLoading(false);
      }
    },
    [collection]
  );

  const fetchCurrentVersionData = useCallback(
    async (collectionData: APICollection) => {
      try {
        setIsVersionDataLoading(true);
        if (viewVersionPermission) {
          const response = await getApiCollectionVersion(
            collectionData.id,
            version
          );

          setCurrentVersionData(response);
          await getAPICollectionEndpoints();
        }
      } finally {
        setIsVersionDataLoading(false);
      }
    },
    [viewVersionPermission, version, getAPICollectionEndpoints]
  );

  const handleTabChange = (activeKey: string) => {
    history.push(
      getVersionPath(
        EntityType.API_COLLECTION,
        decodedEntityFQN,
        String(version),
        activeKey
      )
    );
  };

  const endpointPaginationHandler = useCallback(
    ({ cursorType, currentPage }: PagingHandlerParams) => {
      if (cursorType) {
        getAPICollectionEndpoints({
          paging: {
            [cursorType]: apiEndpoints.paging[cursorType],
          },
        });
      }
      setCurrentEndpointsPage(currentPage);
    },
    [apiEndpoints, getAPICollectionEndpoints]
  );

  const { versionHandler, backHandler } = useMemo(
    () => ({
      versionHandler: (newVersion = version) => {
        history.push(
          getVersionPath(
            EntityType.API_COLLECTION,
            decodedEntityFQN,
            newVersion,
            tab
          )
        );
      },
      backHandler: () => {
        history.push(
          getEntityDetailsPath(EntityType.API_COLLECTION, decodedEntityFQN, tab)
        );
      },
    }),
    [decodedEntityFQN, decodedEntityFQN, tab]
  );

  const { displayName, tags, description } = useMemo(
    () => getCommonDiffsFromVersionData(currentVersionData, changeDescription),
    [currentVersionData, changeDescription]
  );

  const tabs = useMemo(
    () => [
      {
        label: (
          <TabsLabel
            count={apiEndpoints.paging.total}
            id={EntityTabs.API_ENDPOINT}
            isActive={tab === EntityTabs.API_ENDPOINT}
            name={t('label.endpoint-plural')}
          />
        ),
        key: EntityTabs.API_ENDPOINT,
        children: (
          <Row gutter={[0, 16]} wrap={false}>
            <Col className="p-t-sm m-x-lg" flex="auto">
              <APIEndpointsTab
                isVersionView
                apiCollectionDetails={currentVersionData}
                apiEndpoints={apiEndpoints}
                apiEndpointsLoading={apiEndpointsLoading}
                currentEndpointsPage={currentEndpointsPage}
                description={description}
                endpointPaginationHandler={endpointPaginationHandler}
              />
            </Col>
            <Col
              className="entity-tag-right-panel-container"
              data-testid="entity-right-panel"
              flex="220px">
              <Space className="w-full" direction="vertical" size="large">
                <DataProductsContainer
                  activeDomain={domain}
                  dataProducts={currentVersionData?.dataProducts ?? []}
                  hasPermission={false}
                />
                {Object.keys(TagSource).map((tagType) => (
                  <TagsContainerV2
                    displayType={DisplayType.READ_MORE}
                    entityType={EntityType.API_COLLECTION}
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

      {
        key: EntityTabs.CUSTOM_PROPERTIES,
        label: (
          <TabsLabel
            id={EntityTabs.CUSTOM_PROPERTIES}
            isActive={tab === EntityTabs.CUSTOM_PROPERTIES}
            name={t('label.custom-property-plural')}
          />
        ),
        children: (
          <div className="p-md">
            <CustomPropertyTable
              isVersionView
              entityDetails={currentVersionData}
              entityType={EntityType.API_COLLECTION}
              hasEditAccess={false}
              hasPermission={viewVersionPermission}
            />
          </div>
        ),
      },
    ],
    [
      tags,
      domain,
      description,
      currentVersionData,
      apiEndpoints,
      apiEndpointsLoading,
      currentEndpointsPage,
      endpointPaginationHandler,
      viewVersionPermission,
    ]
  );

  const versionComponent = useMemo(() => {
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
                  domainDisplayName={domainDisplayName}
                  entityType={EntityType.API_COLLECTION}
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
                  defaultActiveKey={tab ?? EntityTabs.API_COLLECTION}
                  items={tabs}
                  onChange={handleTabChange}
                />
              </Col>
            </Row>
          </div>
        )}

        <EntityVersionTimeLine
          currentVersion={toString(version)}
          entityType={EntityType.API_COLLECTION}
          versionHandler={versionHandler}
          versionList={versionList}
          onBack={backHandler}
        />
      </>
    );
  }, [
    isLoading,
    viewVersionPermission,
    isVersionDataLoading,
    breadcrumbLinks,
    currentVersionData,
    deleted,
    displayName,
    ownerDisplayName,
    ownerRef,
    tierDisplayName,
    version,
    backHandler,
    tabs,
    versionHandler,
    versionList,
    domainDisplayName,
  ]);

  useEffect(() => {
    if (!isEmpty(decodedEntityFQN)) {
      init();
    }
  }, [decodedEntityFQN]);

  useEffect(() => {
    if (!isUndefined(collection)) {
      fetchCurrentVersionData(collection);
    }
  }, [version, collection]);

  return (
    <PageLayoutV1
      className="version-page-container"
      pageTitle={t('label.entity-version-detail-plural', {
        entity: getEntityName(currentVersionData),
      })}>
      {versionComponent}
    </PageLayoutV1>
  );
};

export default APICollectionVersionPage;
