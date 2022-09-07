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

import { AxiosError } from 'axios';
import { compare, Operation } from 'fast-json-patch';
import { isEmpty, isUndefined } from 'lodash';
import { observer } from 'mobx-react';
import {
  EntityFieldThreadCount,
  EntityTags,
  LeafNodes,
  LineagePos,
  LoadingNodeState,
} from 'Models';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AppState from '../../AppState';
import {
  getAllFeeds,
  postFeedById,
  postThread,
} from '../../axiosAPIs/feedsAPI';
import { getLineageByFQN } from '../../axiosAPIs/lineageAPI';
import { addLineage, deleteLineageEdge } from '../../axiosAPIs/miscAPI';
import {
  addColumnTestCase,
  addFollower,
  addTableTestCase,
  deleteColumnTestCase,
  deleteTableTestCase,
  getTableDetailsByFQN,
  patchTableDetails,
  removeFollower,
} from '../../axiosAPIs/tableAPI';
import ErrorPlaceHolder from '../../components/common/error-with-placeholder/ErrorPlaceHolder';
import { TitleBreadcrumbProps } from '../../components/common/title-breadcrumb/title-breadcrumb.interface';
import DatasetDetails from '../../components/DatasetDetails/DatasetDetails.component';
import {
  Edge,
  EdgeData,
} from '../../components/EntityLineage/EntityLineage.interface';
import Loader from '../../components/Loader/Loader';
import { usePermissionProvider } from '../../components/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from '../../components/PermissionProvider/PermissionProvider.interface';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import {
  getDatabaseDetailsPath,
  getDatabaseSchemaDetailsPath,
  getServiceDetailsPath,
  getTableTabPath,
  getVersionPath,
} from '../../constants/constants';
import { NO_PERMISSION_TO_VIEW } from '../../constants/HelperTextUtil';
import { EntityType, FqnPart, TabSpecificField } from '../../enums/entity.enum';
import { FeedFilter } from '../../enums/mydata.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { CreateThread } from '../../generated/api/feed/createThread';
import { CreateColumnTest } from '../../generated/api/tests/createColumnTest';
import { CreateTableTest } from '../../generated/api/tests/createTableTest';
import {
  Column,
  ColumnTestType,
  Table,
  TableData,
  TableJoins,
  TableType,
  TypeUsedToReturnUsageDetailsOfAnEntity,
} from '../../generated/entity/data/table';
import { Post, Thread, ThreadType } from '../../generated/entity/feed/thread';
import { TableTest, TableTestType } from '../../generated/tests/tableTest';
import { EntityLineage } from '../../generated/type/entityLineage';
import { EntityReference } from '../../generated/type/entityReference';
import { Paging } from '../../generated/type/paging';
import { TagLabel } from '../../generated/type/tagLabel';
import {
  DatasetTestModeType,
  ModifiedTableColumn,
} from '../../interface/dataQuality.interface';
import jsonData from '../../jsons/en';
import {
  addToRecentViewed,
  getCurrentUserId,
  getEntityMissingError,
  getEntityName,
  getFeedCounts,
  getFields,
  getPartialNameFromTableFQN,
} from '../../utils/CommonUtils';
import {
  datasetTableTabs,
  defaultFields,
  getCurrentDatasetTab,
} from '../../utils/DatasetDetailsUtils';
import { getEntityFeedLink, getEntityLineage } from '../../utils/EntityUtils';
import { deletePost, updateThreadData } from '../../utils/FeedUtils';
import { DEFAULT_ENTITY_PERMISSION } from '../../utils/PermissionsUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import { getTagsWithoutTier, getTierTags } from '../../utils/TableUtils';
import { showErrorToast, showSuccessToast } from '../../utils/ToastUtils';

const DatasetDetailsPage: FunctionComponent = () => {
  const history = useHistory();
  const { getEntityPermissionByFqn } = usePermissionProvider();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLineageLoading, setIsLineageLoading] = useState<boolean>(false);
  const [isSampleDataLoading, setIsSampleDataLoading] =
    useState<boolean>(false);
  const [isTableQueriesLoading, setIsTableQueriesLoading] =
    useState<boolean>(false);
  const [isentityThreadLoading, setIsentityThreadLoading] =
    useState<boolean>(false);
  const USERId = getCurrentUserId();
  const [tableId, setTableId] = useState('');
  const [tier, setTier] = useState<TagLabel>();
  const [name, setName] = useState('');
  const [followers, setFollowers] = useState<Array<EntityReference>>([]);
  const [slashedTableName, setSlashedTableName] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<ModifiedTableColumn[]>([]);
  const [sampleData, setSampleData] = useState<TableData>({
    columns: [],
    rows: [],
  });
  const [tableTags, setTableTags] = useState<Array<EntityTags>>([]);
  const [owner, setOwner] = useState<EntityReference>();
  const [joins, setJoins] = useState<TableJoins>({
    startDate: new Date(),
    dayCount: 0,
    columnJoins: [],
    directTableJoins: [],
  });
  const [tableType, setTableType] = useState<TableType>(TableType.Regular);
  const [tableProfile, setTableProfile] = useState<Table['profile']>();
  const [tableDetails, setTableDetails] = useState<Table>({} as Table);
  const { datasetFQN, tab } = useParams() as Record<string, string>;
  const [activeTab, setActiveTab] = useState<number>(getCurrentDatasetTab(tab));
  const [entityLineage, setEntityLineage] = useState<EntityLineage>(
    {} as EntityLineage
  );
  const [leafNodes, setLeafNodes] = useState<LeafNodes>({} as LeafNodes);
  const [usageSummary, setUsageSummary] =
    useState<TypeUsedToReturnUsageDetailsOfAnEntity>(
      {} as TypeUsedToReturnUsageDetailsOfAnEntity
    );
  const [currentVersion, setCurrentVersion] = useState<string>();
  const [isNodeLoading, setNodeLoading] = useState<LoadingNodeState>({
    id: undefined,
    state: false,
  });
  const [tableFQN, setTableFQN] = useState<string>(
    getPartialNameFromTableFQN(
      datasetFQN,
      [FqnPart.Service, FqnPart.Database, FqnPart.Schema, FqnPart.Table],
      FQN_SEPARATOR_CHAR
    )
  );
  const [deleted, setDeleted] = useState<boolean>(false);
  const [isError, setIsError] = useState(false);
  const [tableQueries, setTableQueries] = useState<Table['tableQueries']>([]);
  const [entityThread, setEntityThread] = useState<Thread[]>([]);

  const [feedCount, setFeedCount] = useState<number>(0);
  const [entityFieldThreadCount, setEntityFieldThreadCount] = useState<
    EntityFieldThreadCount[]
  >([]);
  const [entityFieldTaskCount, setEntityFieldTaskCount] = useState<
    EntityFieldThreadCount[]
  >([]);

  const [tablePermissions, setTablePermissions] = useState<OperationPermission>(
    DEFAULT_ENTITY_PERMISSION
  );

  // Data Quality tab state
  const [testMode, setTestMode] = useState<DatasetTestModeType>('table');
  const [showTestForm, setShowTestForm] = useState(false);
  const [tableTestCase, setTableTestCase] = useState<TableTest[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>();

  const [paging, setPaging] = useState<Paging>({} as Paging);

  const handleTestModeChange = (mode: DatasetTestModeType) => {
    setTestMode(mode);
  };

  const handleShowTestForm = (value: boolean) => {
    setShowTestForm(value);
  };

  const handleSelectedColumn = (value: string | undefined) => {
    setSelectedColumn(value);
  };

  const activeTabHandler = (tabValue: number) => {
    const currentTabIndex = tabValue - 1;
    if (datasetTableTabs[currentTabIndex].path !== tab) {
      setActiveTab(
        getCurrentDatasetTab(datasetTableTabs[currentTabIndex].path)
      );
      history.push({
        pathname: getTableTabPath(
          tableFQN,
          datasetTableTabs[currentTabIndex].path
        ),
      });
      handleShowTestForm(false);
    }
  };

  const qualityTestFormHandler = (
    tabValue: number,
    testMode?: DatasetTestModeType,
    columnName?: string
  ) => {
    activeTabHandler(tabValue);
    if (testMode) {
      setTestMode(testMode as DatasetTestModeType);
      setShowTestForm(true);
      if (columnName) {
        setSelectedColumn(columnName);
      }
    }
  };

  const getLineageData = () => {
    setIsLineageLoading(true);
    getLineageByFQN(tableFQN, EntityType.TABLE)
      .then((res) => {
        if (res) {
          setEntityLineage(res);
        } else {
          showErrorToast(jsonData['api-error-messages']['fetch-lineage-error']);
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['fetch-lineage-error']
        );
      })
      .finally(() => {
        setIsLineageLoading(false);
      });
  };

  const getFeedData = (
    after?: string,
    feedType?: FeedFilter,
    threadType?: ThreadType
  ) => {
    setIsentityThreadLoading(true);
    getAllFeeds(
      getEntityFeedLink(EntityType.TABLE, tableFQN),
      after,
      threadType,
      feedType,
      undefined,
      USERId
    )
      .then((res) => {
        const { data, paging: pagingObj } = res;
        if (data) {
          setPaging(pagingObj);
          setEntityThread((prevData) => [...prevData, ...data]);
        } else {
          showErrorToast(
            jsonData['api-error-messages']['fetch-entity-feed-error']
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['fetch-entity-feed-error']
        );
      })
      .finally(() => setIsentityThreadLoading(false));
  };

  const handleFeedFetchFromFeedList = (
    after?: string,
    feedType?: FeedFilter,
    threadType?: ThreadType
  ) => {
    !after && setEntityThread([]);
    getFeedData(after, feedType, threadType);
  };

  const fetchResourcePermission = async (entityFqn: string) => {
    setIsLoading(true);
    try {
      const tablePermission = await getEntityPermissionByFqn(
        ResourceEntity.TABLE,
        entityFqn
      );

      setTablePermissions(tablePermission);
    } catch (error) {
      showErrorToast(
        jsonData['api-error-messages']['fetch-entity-permissions-error']
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableDetail = () => {
    setIsLoading(true);
    getTableDetailsByFQN(
      tableFQN,
      getFields(defaultFields, datasetTableTabs[activeTab - 1].field ?? '')
    )
      .then((res) => {
        if (res) {
          const {
            description,
            id,
            name,
            columns,
            database,
            deleted,
            owner,
            usageSummary,
            followers,
            fullyQualifiedName,
            joins,
            tags,
            sampleData,
            profile,
            tableType,
            version,
            service,
            serviceType,
            databaseSchema,
          } = res;
          const serviceName = service?.name ?? '';
          const databaseFullyQualifiedName = database?.fullyQualifiedName ?? '';
          const databaseSchemaFullyQualifiedName =
            databaseSchema?.fullyQualifiedName ?? '';
          setTableDetails(res);
          setTableId(id);
          setCurrentVersion(version + '');
          setTier(getTierTags(tags ?? []));
          setTableType(tableType as TableType);
          setOwner(owner);
          setFollowers(followers ?? []);
          setDeleted(Boolean(deleted));
          setSlashedTableName([
            {
              name: serviceName,
              url: serviceName
                ? getServiceDetailsPath(
                    serviceName,
                    ServiceCategory.DATABASE_SERVICES
                  )
                : '',
              imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
            },
            {
              name: getPartialNameFromTableFQN(databaseFullyQualifiedName, [
                FqnPart.Database,
              ]),
              url: getDatabaseDetailsPath(databaseFullyQualifiedName),
            },
            {
              name: getPartialNameFromTableFQN(
                databaseSchemaFullyQualifiedName,
                [FqnPart.Schema]
              ),
              url: getDatabaseSchemaDetailsPath(
                databaseSchemaFullyQualifiedName
              ),
            },
            {
              name: getEntityName(res),
              url: '',
              activeTitle: true,
            },
          ]);

          if (res.tableTests && res.tableTests.length > 0) {
            setTableTestCase(res.tableTests);
          }

          addToRecentViewed({
            displayName: getEntityName(res),
            entityType: EntityType.TABLE,
            fqn: fullyQualifiedName ?? '',
            serviceType: serviceType,
            timestamp: 0,
            id: id,
          });
          setName(name);

          setDescription(description ?? '');
          setColumns(columns || []);
          setSampleData(sampleData as TableData);
          setTableProfile(profile);
          setTableTags(getTagsWithoutTier(tags || []));
          setUsageSummary(
            usageSummary as TypeUsedToReturnUsageDetailsOfAnEntity
          );
          setJoins(joins as TableJoins);
        } else {
          showErrorToast(
            jsonData['api-error-messages']['fetch-table-details-error']
          );
          setIsError(true);
        }
      })
      .catch((err: AxiosError) => {
        if (err.response?.status === 404) {
          setIsError(true);
        } else {
          showErrorToast(
            err,
            jsonData['api-error-messages']['fetch-table-details-error']
          );
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const fetchTabSpecificData = (tabField = '') => {
    switch (tabField) {
      case TabSpecificField.SAMPLE_DATA: {
        if (!isUndefined(sampleData)) {
          break;
        } else {
          setIsSampleDataLoading(true);
          getTableDetailsByFQN(tableFQN, tabField)
            .then((res) => {
              if (res) {
                const { sampleData } = res;
                setSampleData(sampleData as TableData);
              } else {
                showErrorToast(
                  jsonData['api-error-messages']['fetch-sample-data-error']
                );
              }
            })
            .catch((err: AxiosError) => {
              showErrorToast(
                err,
                jsonData['api-error-messages']['fetch-sample-data-error']
              );
            })
            .finally(() => setIsSampleDataLoading(false));

          break;
        }
      }

      case TabSpecificField.LINEAGE: {
        if (!deleted) {
          if (isEmpty(entityLineage)) {
            getLineageData();
          }

          break;
        }

        break;
      }

      case TabSpecificField.TABLE_QUERIES: {
        if ((tableQueries?.length ?? 0) > 0) {
          break;
        } else {
          setIsTableQueriesLoading(true);
          getTableDetailsByFQN(tableFQN, tabField)
            .then((res) => {
              if (res) {
                const { tableQueries } = res;
                setTableQueries(tableQueries);
              } else {
                showErrorToast(
                  jsonData['api-error-messages']['fetch-table-queries-error']
                );
              }
            })
            .catch((err: AxiosError) => {
              showErrorToast(
                err,
                jsonData['api-error-messages']['fetch-table-queries-error']
              );
            })
            .finally(() => setIsTableQueriesLoading(false));

          break;
        }
      }
      case TabSpecificField.ACTIVITY_FEED: {
        getFeedData();

        break;
      }

      default:
        break;
    }
  };

  useEffect(() => {
    if (datasetTableTabs[activeTab - 1].path !== tab) {
      setActiveTab(getCurrentDatasetTab(tab));
    }
    setEntityThread([]);
  }, [tab]);

  useEffect(() => {
    fetchTabSpecificData(datasetTableTabs[activeTab - 1].field);
  }, [activeTab]);

  const getEntityFeedCount = () => {
    getFeedCounts(
      EntityType.TABLE,
      tableFQN,
      setEntityFieldThreadCount,
      setEntityFieldTaskCount,
      setFeedCount
    );
  };

  const saveUpdatedTableData = (updatedData: Table) => {
    const jsonPatch = compare(tableDetails, updatedData);

    return patchTableDetails(tableId, jsonPatch);
  };

  const descriptionUpdateHandler = async (updatedTable: Table) => {
    try {
      const response = await saveUpdatedTableData(updatedTable);
      if (response) {
        const { description, version } = response;
        setCurrentVersion(version + '');
        setTableDetails(response);
        setDescription(description ?? '');
        getEntityFeedCount();
      } else {
        throw jsonData['api-error-messages']['update-description-error'];
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const columnsUpdateHandler = async (updatedTable: Table) => {
    try {
      const response = await saveUpdatedTableData(updatedTable);
      if (response) {
        const { columns, version } = response;
        setCurrentVersion(version + '');
        setTableDetails(response);
        setColumns(columns);
        getEntityFeedCount();
      } else {
        throw jsonData['api-error-messages']['update-entity-error'];
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const onTagUpdate = (updatedTable: Table) => {
    saveUpdatedTableData(updatedTable)
      .then((res) => {
        if (res) {
          setTableDetails(res);
          setTier(getTierTags(res.tags ?? []));
          setCurrentVersion(res.version + '');
          setTableTags(getTagsWithoutTier(res.tags ?? []));
          getEntityFeedCount();
        } else {
          showErrorToast(jsonData['api-error-messages']['update-tags-error']);
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['update-tags-error']
        );
      });
  };

  const settingsUpdateHandler = (updatedTable: Table): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      saveUpdatedTableData(updatedTable)
        .then((res) => {
          if (res) {
            const { version, owner, tags = [] } = res;
            setCurrentVersion(version + '');
            setTableDetails(res);
            setOwner(owner);
            setTier(getTierTags(tags));
            getEntityFeedCount();
            resolve();
          } else {
            showErrorToast(
              jsonData['api-error-messages']['update-entity-error']
            );
          }
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['update-entity-error']
          );
          reject();
        });
    });
  };

  const followTable = () => {
    addFollower(tableId, USERId)
      .then((res) => {
        if (res) {
          const { newValue } = res.changeDescription.fieldsAdded[0];

          setFollowers([...followers, ...newValue]);
        } else {
          showErrorToast(
            jsonData['api-error-messages']['update-entity-follow-error']
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['update-entity-follow-error']
        );
      });
  };
  const unfollowTable = () => {
    removeFollower(tableId, USERId)
      .then((res) => {
        if (res) {
          const { oldValue } = res.changeDescription.fieldsDeleted[0];

          setFollowers(
            followers.filter((follower) => follower.id !== oldValue[0].id)
          );
        } else {
          showErrorToast(
            jsonData['api-error-messages']['update-entity-unfollow-error']
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['update-entity-unfollow-error']
        );
      });
  };

  const versionHandler = () => {
    history.push(
      getVersionPath(EntityType.TABLE, tableFQN, currentVersion as string)
    );
  };

  const setLeafNode = (val: EntityLineage, pos: LineagePos) => {
    if (pos === 'to' && val.downstreamEdges?.length === 0) {
      setLeafNodes((prev) => ({
        ...prev,
        downStreamNode: [...(prev.downStreamNode ?? []), val.entity.id],
      }));
    }
    if (pos === 'from' && val.upstreamEdges?.length === 0) {
      setLeafNodes((prev) => ({
        ...prev,
        upStreamNode: [...(prev.upStreamNode ?? []), val.entity.id],
      }));
    }
  };

  const entityLineageHandler = (lineage: EntityLineage) => {
    setEntityLineage(lineage);
  };

  const loadNodeHandler = (node: EntityReference, pos: LineagePos) => {
    setNodeLoading({ id: node.id, state: true });
    getLineageByFQN(node.fullyQualifiedName ?? '', node.type)
      .then((res) => {
        if (res) {
          setLeafNode(res, pos);
          setEntityLineage(getEntityLineage(entityLineage, res, pos));
        } else {
          showErrorToast(
            jsonData['api-error-messages']['fetch-lineage-node-error']
          );
        }
        setTimeout(() => {
          setNodeLoading((prev) => ({ ...prev, state: false }));
        }, 500);
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['fetch-lineage-node-error']
        );
      });
  };

  const addLineageHandler = (edge: Edge): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      addLineage(edge)
        .then(() => {
          resolve();
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['add-lineage-error']
          );
          reject();
        });
    });
  };

  const removeLineageHandler = (data: EdgeData) => {
    deleteLineageEdge(
      data.fromEntity,
      data.fromId,
      data.toEntity,
      data.toId
    ).catch((err: AxiosError) => {
      showErrorToast(
        err,
        jsonData['api-error-messages']['delete-lineage-error']
      );
    });
  };

  const postFeedHandler = (value: string, id: string) => {
    const currentUser = AppState.userDetails?.name ?? AppState.users[0]?.name;

    const data = {
      message: value,
      from: currentUser,
    } as Post;
    postFeedById(id, data)
      .then((res) => {
        if (res) {
          const { id, posts } = res;
          setEntityThread((pre) => {
            return pre.map((thread) => {
              if (thread.id === id) {
                return { ...res, posts: posts?.slice(-3) };
              } else {
                return thread;
              }
            });
          });
          getEntityFeedCount();
        } else {
          showErrorToast(jsonData['api-error-messages']['add-feed-error']);
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(err, jsonData['api-error-messages']['add-feed-error']);
      });
  };

  const createThread = (data: CreateThread) => {
    postThread(data)
      .then((res) => {
        if (res) {
          setEntityThread((pre) => [...pre, res]);
          getEntityFeedCount();
        } else {
          showErrorToast(
            jsonData['api-error-messages']['create-conversation-error']
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['create-conversation-error']
        );
      });
  };

  const handleAddTableTestCase = (data: CreateTableTest) => {
    addTableTestCase(tableDetails.id, data)
      .then((res) => {
        if (res) {
          const { tableTests = [] } = res;
          let itsNewTest = true;
          const existingData = tableTestCase.map((test) => {
            if (test.name === tableTests[0].name) {
              itsNewTest = false;

              return tableTests[0];
            }

            return test;
          });
          if (itsNewTest) {
            existingData.push(tableTests[0]);
          }
          setTableTestCase(existingData);
          handleShowTestForm(false);
          showSuccessToast(
            `Test ${data.testCase.tableTestType} for ${name} has been ${
              itsNewTest ? 'added' : 'updated'
            } successfully.`
          );
        } else {
          showErrorToast(
            jsonData['api-error-messages']['add-table-test-error']
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['add-table-test-error']
        );
      });
  };

  const handleAddColumnTestCase = (data: CreateColumnTest) => {
    addColumnTestCase(tableDetails.id, data)
      .then((res) => {
        if (res) {
          let itsNewTest = true;
          const columnTestRes = res.columns.find(
            (d: Column) => d.name === data.columnName
          );
          const updatedColumns = columns.map((d) => {
            if (d.name === data.columnName) {
              const columnTest = columnTestRes?.columnTests?.length
                ? columnTestRes?.columnTests[0]
                : null;
              const oldTest =
                (d as ModifiedTableColumn)?.columnTests?.filter(
                  (test) => test.id !== columnTest?.id
                ) || [];

              itsNewTest =
                oldTest.length ===
                (d as ModifiedTableColumn)?.columnTests?.length;

              return {
                ...d,
                columnTests: columnTest ? [...oldTest, columnTest] : oldTest,
              };
            }

            return d;
          });
          setColumns(updatedColumns);
          handleShowTestForm(false);
          setSelectedColumn(undefined);
          showSuccessToast(
            `Test ${data.testCase.columnTestType} for ${
              data.columnName
            } has been ${itsNewTest ? 'added' : 'updated'} successfully.`
          );
        } else {
          showErrorToast(
            jsonData['api-error-messages']['add-column-test-error']
          );
        }
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['add-column-test-error']
        );
      });
  };

  const handleRemoveTableTest = (testType: TableTestType) => {
    deleteTableTestCase(tableDetails.id, testType)
      .then(() => {
        const updatedTest = tableTestCase.filter(
          (d) => d.testCase.tableTestType !== testType
        );
        setTableTestCase(updatedTest);
        showSuccessToast(jsonData['api-success-messages']['delete-test']);
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['delete-test-error']
        );
      });
  };

  const handleRemoveColumnTest = (
    columnName: string,
    testType: ColumnTestType
  ) => {
    deleteColumnTestCase(tableDetails.id, columnName, testType)
      .then(() => {
        const updatedColumns = columns.map((d) => {
          if (d.name === columnName) {
            const updatedTest =
              (d as ModifiedTableColumn)?.columnTests?.filter(
                (test) => test.testCase.columnTestType !== testType
              ) || [];

            return {
              ...d,
              columnTests: updatedTest,
            };
          }

          return d;
        });
        setColumns(updatedColumns);
        showSuccessToast(jsonData['api-success-messages']['delete-test']);
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['delete-test-error']
        );
      });
  };

  const deletePostHandler = (
    threadId: string,
    postId: string,
    isThread: boolean
  ) => {
    deletePost(threadId, postId, isThread, setEntityThread);
  };

  const updateThreadHandler = (
    threadId: string,
    postId: string,
    isThread: boolean,
    data: Operation[]
  ) => {
    updateThreadData(threadId, postId, isThread, data, setEntityThread);
  };

  const handleExtentionUpdate = async (updatedTable: Table) => {
    try {
      const response = await saveUpdatedTableData(updatedTable);
      if (response) {
        const { version, owner: ownerValue, tags } = response;
        setCurrentVersion(version?.toString());
        setTableDetails(response);
        setOwner(ownerValue);
        setTier(getTierTags(tags ?? []));
      } else {
        throw jsonData['api-error-messages']['update-entity-error'];
      }
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  useEffect(() => {
    if (tablePermissions.ViewAll) {
      fetchTableDetail();
      setActiveTab(getCurrentDatasetTab(tab));
      getEntityFeedCount();
    }
  }, [tablePermissions]);

  useEffect(() => {
    fetchResourcePermission(tableFQN);
  }, [tableFQN]);

  useEffect(() => {
    setTableFQN(
      getPartialNameFromTableFQN(
        datasetFQN,
        [FqnPart.Service, FqnPart.Database, FqnPart.Schema, FqnPart.Table],
        FQN_SEPARATOR_CHAR
      )
    );
    setEntityLineage({} as EntityLineage);
  }, [datasetFQN]);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <ErrorPlaceHolder>
          {getEntityMissingError('table', tableFQN)}
        </ErrorPlaceHolder>
      ) : (
        <>
          {tablePermissions.ViewAll ? (
            <DatasetDetails
              activeTab={activeTab}
              addLineageHandler={addLineageHandler}
              columns={columns}
              columnsUpdateHandler={columnsUpdateHandler}
              createThread={createThread}
              dataModel={tableDetails.dataModel}
              datasetFQN={tableFQN}
              deletePostHandler={deletePostHandler}
              deleted={deleted}
              description={description}
              descriptionUpdateHandler={descriptionUpdateHandler}
              entityFieldTaskCount={entityFieldTaskCount}
              entityFieldThreadCount={entityFieldThreadCount}
              entityLineage={entityLineage}
              entityLineageHandler={entityLineageHandler}
              entityName={name}
              entityThread={entityThread}
              feedCount={feedCount}
              fetchFeedHandler={handleFeedFetchFromFeedList}
              followTableHandler={followTable}
              followers={followers}
              handleAddColumnTestCase={handleAddColumnTestCase}
              handleAddTableTestCase={handleAddTableTestCase}
              handleExtentionUpdate={handleExtentionUpdate}
              handleRemoveColumnTest={handleRemoveColumnTest}
              handleRemoveTableTest={handleRemoveTableTest}
              handleSelectedColumn={handleSelectedColumn}
              handleShowTestForm={handleShowTestForm}
              handleTestModeChange={handleTestModeChange}
              isLineageLoading={isLineageLoading}
              isNodeLoading={isNodeLoading}
              isQueriesLoading={isTableQueriesLoading}
              isSampleDataLoading={isSampleDataLoading}
              isentityThreadLoading={isentityThreadLoading}
              joins={joins}
              lineageLeafNodes={leafNodes}
              loadNodeHandler={loadNodeHandler}
              owner={owner as EntityReference}
              paging={paging}
              postFeedHandler={postFeedHandler}
              qualityTestFormHandler={qualityTestFormHandler}
              removeLineageHandler={removeLineageHandler}
              sampleData={sampleData}
              selectedColumn={selectedColumn as string}
              setActiveTabHandler={activeTabHandler}
              settingsUpdateHandler={settingsUpdateHandler}
              showTestForm={showTestForm}
              slashedTableName={slashedTableName}
              tableDetails={tableDetails}
              tableProfile={tableProfile}
              tableQueries={tableQueries}
              tableTags={tableTags}
              tableTestCase={tableTestCase}
              tableType={tableType}
              tagUpdateHandler={onTagUpdate}
              testMode={testMode}
              tier={tier as TagLabel}
              unfollowTableHandler={unfollowTable}
              updateThreadHandler={updateThreadHandler}
              usageSummary={usageSummary}
              version={currentVersion}
              versionHandler={versionHandler}
            />
          ) : (
            <ErrorPlaceHolder>{NO_PERMISSION_TO_VIEW}</ErrorPlaceHolder>
          )}
        </>
      )}
    </>
  );
};

export default observer(DatasetDetailsPage);
