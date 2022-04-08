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

import { AxiosError, AxiosResponse } from 'axios';
import classNames from 'classnames';
import { compare } from 'fast-json-patch';
import { isNil } from 'lodash';
import { observer } from 'mobx-react';
import {
  EntityFieldThreadCount,
  EntityThread,
  ExtraInfo,
  Paging,
} from 'Models';
import React, {
  Fragment,
  FunctionComponent,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { default as AppState, default as appState } from '../../AppState';
import {
  getDatabaseDetailsByFQN,
  patchDatabaseDetails,
} from '../../axiosAPIs/databaseAPI';
import {
  getAllFeeds,
  getFeedCount,
  postFeedById,
  postThread,
} from '../../axiosAPIs/feedsAPI';
import { getDatabaseTables } from '../../axiosAPIs/tableAPI';
import ActivityFeedList from '../../components/ActivityFeed/ActivityFeedList/ActivityFeedList';
import ActivityThreadPanel from '../../components/ActivityFeed/ActivityThreadPanel/ActivityThreadPanel';
import Description from '../../components/common/description/Description';
import ErrorPlaceHolder from '../../components/common/error-with-placeholder/ErrorPlaceHolder';
import NextPrevious from '../../components/common/next-previous/NextPrevious';
import RichTextEditorPreviewer from '../../components/common/rich-text-editor/RichTextEditorPreviewer';
import TabsPane from '../../components/common/TabsPane/TabsPane';
import TitleBreadcrumb from '../../components/common/title-breadcrumb/title-breadcrumb.component';
import { TitleBreadcrumbProps } from '../../components/common/title-breadcrumb/title-breadcrumb.interface';
import PageContainer from '../../components/containers/PageContainer';
import Loader from '../../components/Loader/Loader';
import ManageTabComponent from '../../components/ManageTab/ManageTab.component';
import RequestDescriptionModal from '../../components/Modals/RequestDescriptionModal/RequestDescriptionModal';
import TagsViewer from '../../components/tags-viewer/tags-viewer';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import {
  getDatabaseDetailsPath,
  getExplorePathWithSearch,
  getServiceDetailsPath,
  getTableDetailsPath,
  getTeamDetailsPath,
  pagingObject,
} from '../../constants/constants';
import { observerOptions } from '../../constants/Mydata.constants';
import { EntityType, TabSpecificField } from '../../enums/entity.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { CreateThread } from '../../generated/api/feed/createThread';
import { Database } from '../../generated/entity/data/database';
import { Table } from '../../generated/entity/data/table';
import { EntityReference } from '../../generated/entity/teams/user';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import useToastContext from '../../hooks/useToastContext';
import jsonData from '../../jsons/en';
import { hasEditAccess, isEven } from '../../utils/CommonUtils';
import {
  databaseDetailsTabs,
  getCurrentDatabaseDetailsTab,
} from '../../utils/DatabaseDetailsUtils';
import { getEntityFeedLink, getInfoElements } from '../../utils/EntityUtils';
import { getDefaultValue } from '../../utils/FeedElementUtils';
import {
  deletePost,
  getEntityFieldThreadCounts,
  getUpdatedThread,
} from '../../utils/FeedUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import { getErrorText } from '../../utils/StringsUtils';
import { getOwnerFromId, getUsagePercentile } from '../../utils/TableUtils';

const DatabaseSchemaPage: FunctionComponent = () => {
  // User Id for getting followers
  const [slashedTableName, setSlashedTableName] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);

  const showToast = useToastContext();
  const { databaseSchemaFQN, tab } = useParams() as Record<string, string>;
  const [isLoading, setIsLoading] = useState(true);
  const [database, setDatabase] = useState<Database>();
  const [serviceType, setServiceType] = useState<string>();
  const [tableData, setTableData] = useState<Array<Table>>([]);

  const [databaseSchemaName, setDatabaseSchemaName] = useState<string>(
    databaseSchemaFQN.split(FQN_SEPARATOR_CHAR).slice(-1).pop() || ''
  );
  const [isEdit, setIsEdit] = useState(false);
  const [description, setDescription] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [tablePaging, setTablePaging] = useState<Paging>(pagingObject);
  const [tableInstanceCount, setTableInstanceCount] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<number>(
    getCurrentDatabaseDetailsTab(tab)
  );
  const [error, setError] = useState('');

  const [entityThread, setEntityThread] = useState<EntityThread[]>([]);
  const [isentityThreadLoading, setIsentityThreadLoading] =
    useState<boolean>(false);
  const [feedCount, setFeedCount] = useState<number>(0);
  const [entityFieldThreadCount, setEntityFieldThreadCount] = useState<
    EntityFieldThreadCount[]
  >([]);

  const [threadLink, setThreadLink] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('');
  const [paging, setPaging] = useState<Paging>({} as Paging);
  const [elementRef, isInView] = useInfiniteScroll(observerOptions);

  const history = useHistory();
  const isMounting = useRef(true);

  const tabs = [
    {
      name: 'Tables',
      icon: {
        alt: 'tables',
        name: 'table-grey',
        title: 'Tables',
        selectedName: 'table',
      },
      count: tableInstanceCount,
      isProtected: false,
      position: 1,
    },
    {
      name: 'Activity Feed',
      icon: {
        alt: 'activity_feed',
        name: 'activity_feed',
        title: 'Activity Feed',
        selectedName: 'activity-feed-color',
      },
      isProtected: false,
      position: 2,
      count: feedCount,
    },
    {
      name: 'Manage',
      icon: {
        alt: 'manage',
        name: 'icon-manage',
        title: 'Manage',
        selectedName: 'icon-managecolor',
      },
      isProtected: false,
      position: 3,
    },
  ];

  const extraInfo: Array<ExtraInfo> = [
    {
      key: 'Owner',
      value:
        database?.owner?.type === 'team'
          ? getTeamDetailsPath(
              database?.owner?.displayName || database?.owner?.name || ''
            )
          : database?.owner?.displayName || database?.owner?.name || '',
      placeholderText:
        database?.owner?.displayName || database?.owner?.name || '',
      isLink: database?.owner?.type === 'team',
      openInNewTab: false,
    },
  ];

  const handleShowErrorToast = (errMessage: string) => {
    showToast({
      variant: 'error',
      body: errMessage,
    });
  };

  const handleShowSuccessToast = (message: string) => {
    showToast({
      variant: 'success',
      body: message,
    });
  };

  const fetchDatabaseTables = (pagingObj?: string) => {
    return new Promise<void>((resolve, reject) => {
      getDatabaseTables(databaseSchemaFQN, pagingObj, [
        'owner',
        'tags',
        'columns',
        'usageSummary',
      ])
        .then((res: AxiosResponse) => {
          if (res.data.data) {
            setTableData(res.data.data);
            setTablePaging(res.data.paging);
            setTableInstanceCount(res.data.paging.total);
          } else {
            setTableData([]);
            setTablePaging(pagingObject);

            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
          resolve();
        })
        .catch((err: AxiosError) => {
          const errMsg = getErrorText(
            err,
            jsonData['api-error-messages']['fetch-database-tables-error']
          );

          handleShowErrorToast(errMsg);
          reject();
        });
    });
  };

  const fetchDatabaseTablesAndDBTModels = () => {
    setIsLoading(true);
    Promise.allSettled([fetchDatabaseTables()]).finally(() => {
      setIsLoading(false);
    });
  };

  const onThreadLinkSelect = (link: string) => {
    setThreadLink(link);
  };

  const onThreadPanelClose = () => {
    setThreadLink('');
  };

  const onEntityFieldSelect = (value: string) => {
    setSelectedField(value);
  };
  const closeRequestModal = () => {
    setSelectedField('');
  };

  const getEntityFeedCount = () => {
    getFeedCount(getEntityFeedLink(EntityType.DATABASE, databaseSchemaFQN))
      .then((res: AxiosResponse) => {
        if (res.data) {
          setFeedCount(res.data.totalCount);
          setEntityFieldThreadCount(res.data.counts);
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        const errMsg = getErrorText(
          err,
          jsonData['api-error-messages']['fetch-entity-feed-count-error']
        );

        handleShowErrorToast(errMsg);
      });
  };

  const getDetailsByFQN = () => {
    getDatabaseDetailsByFQN(databaseSchemaFQN, ['owner'])
      .then((res: AxiosResponse) => {
        if (res.data) {
          const { description, id, name, service, serviceType } = res.data;
          setDatabase(res.data);
          setDescription(description);
          setDatabaseId(id);
          setDatabaseSchemaName(name);

          setServiceType(serviceType);

          setSlashedTableName([
            {
              name: service.name,
              url: service.name
                ? getServiceDetailsPath(
                    service.name,
                    ServiceCategory.DATABASE_SERVICES
                  )
                : '',
              imgSrc: serviceType ? serviceTypeLogo(serviceType) : undefined,
            },
            {
              name: name,
              url: '',
              activeTitle: true,
            },
          ]);
          fetchDatabaseTablesAndDBTModels();
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        const errMsg = getErrorText(
          err,
          jsonData['api-error-messages']['fetch-database-details-error']
        );
        setError(errMsg);
        handleShowErrorToast(errMsg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const onCancel = () => {
    setIsEdit(false);
  };

  const saveUpdatedDatabaseData = (
    updatedData: Database
  ): Promise<AxiosResponse> => {
    let jsonPatch;
    if (database) {
      jsonPatch = compare(database, updatedData);
    }

    return patchDatabaseDetails(
      databaseId,
      jsonPatch
    ) as unknown as Promise<AxiosResponse>;
  };

  const onDescriptionUpdate = (updatedHTML: string) => {
    if (description !== updatedHTML && database) {
      const updatedDatabaseDetails = {
        ...database,
        description: updatedHTML,
      };
      saveUpdatedDatabaseData(updatedDatabaseDetails)
        .then((res: AxiosResponse) => {
          if (res.data) {
            setDatabase(updatedDatabaseDetails);
            setDescription(updatedHTML);
            getEntityFeedCount();
          } else {
            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
        })
        .catch((err: AxiosError) => {
          const errMsg = getErrorText(
            err,
            jsonData['api-error-messages']['update-database-error']
          );
          handleShowErrorToast(errMsg);
        })
        .finally(() => {
          setIsEdit(false);
        });
    }
  };

  const onDescriptionEdit = (): void => {
    setIsEdit(true);
  };

  const activeTabHandler = (tabValue: number) => {
    const currentTabIndex = tabValue - 1;
    if (databaseDetailsTabs[currentTabIndex].path !== tab) {
      setActiveTab(tabValue);
      history.push({
        pathname: getDatabaseDetailsPath(
          databaseSchemaFQN,
          databaseDetailsTabs[currentTabIndex].path
        ),
      });
    }
  };

  const tablePagingHandler = (cursorType: string) => {
    const pagingString = `&${cursorType}=${
      tablePaging[cursorType as keyof typeof tablePaging]
    }`;
    setIsLoading(true);
    fetchDatabaseTables(pagingString).finally(() => {
      setIsLoading(false);
    });
  };

  const handleUpdateOwner = (owner: Database['owner']) => {
    const updatedData = {
      ...database,
      owner,
    };

    return new Promise<void>((_, reject) => {
      saveUpdatedDatabaseData(updatedData as Database)
        .then((res: AxiosResponse) => {
          if (res.data) {
            setDatabase(res.data);
            reject();
          } else {
            reject();

            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
        })
        .catch((err: AxiosError) => {
          const errMsg = getErrorText(
            err,
            jsonData['api-error-messages']['update-database-error']
          );
          handleShowErrorToast(errMsg);
          reject();
        });
    });
  };

  const fetchActivityFeed = (after?: string) => {
    setIsentityThreadLoading(true);
    getAllFeeds(
      getEntityFeedLink(EntityType.DATABASE, databaseSchemaFQN),
      after
    )
      .then((res: AxiosResponse) => {
        const { data, paging: pagingObj } = res.data;
        if (data) {
          setPaging(pagingObj);
          setEntityThread((prevData) => [...prevData, ...data]);
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        const errMsg = getErrorText(
          err,
          jsonData['api-error-messages']['fetch-entity-feed-error']
        );

        handleShowErrorToast(errMsg);
      })
      .finally(() => setIsentityThreadLoading(false));
  };

  const postFeedHandler = (value: string, id: string) => {
    const currentUser = AppState.userDetails?.name ?? AppState.users[0]?.name;

    const data = {
      message: value,
      from: currentUser,
    };
    postFeedById(id, data)
      .then((res: AxiosResponse) => {
        if (res.data) {
          const { id, posts } = res.data;
          setEntityThread((pre) => {
            return pre.map((thread) => {
              if (thread.id === id) {
                return { ...res.data, posts: posts.slice(-3) };
              } else {
                return thread;
              }
            });
          });
          getEntityFeedCount();
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        const errMsg = getErrorText(
          err,
          jsonData['api-error-messages']['add-feed-error']
        );

        handleShowErrorToast(errMsg);
      });
  };

  const createThread = (data: CreateThread) => {
    postThread(data)
      .then((res: AxiosResponse) => {
        if (res.data) {
          setEntityThread((pre) => [...pre, res.data]);
          getEntityFeedCount();
          handleShowSuccessToast(
            jsonData['api-success-messages']['create-conversation']
          );
        } else {
          throw jsonData['api-error-messages']['unexpected-server-response'];
        }
      })
      .catch((err: AxiosError) => {
        const errMsg = getErrorText(
          err,
          jsonData['api-error-messages']['create-conversation-error']
        );

        handleShowErrorToast(errMsg);
      });
  };

  const deletePostHandler = (threadId: string, postId: string) => {
    deletePost(threadId, postId)
      .then(() => {
        getUpdatedThread(threadId)
          .then((data) => {
            if (data) {
              setEntityThread((pre) => {
                return pre.map((thread) => {
                  if (thread.id === data.id) {
                    return {
                      ...thread,
                      posts: data.posts.slice(-3),
                      postsCount: data.postsCount,
                    };
                  } else {
                    return thread;
                  }
                });
              });
            } else {
              throw jsonData['api-error-messages'][
                'unexpected-server-response'
              ];
            }
          })
          .catch((error) => {
            const errMsg = getErrorText(
              error,
              jsonData['api-error-messages']['fetch-updated-conversation-error']
            );

            handleShowErrorToast(errMsg);
          });

        handleShowSuccessToast(
          jsonData['api-success-messages']['delete-message']
        );
      })
      .catch((error: AxiosError) => {
        const message = getErrorText(
          error,
          jsonData['api-error-messages']['delete-message-error']
        );
        handleShowErrorToast(message);
      });
  };

  const getLoader = () => {
    return isentityThreadLoading ? <Loader /> : null;
  };

  const fetchMoreFeed = (
    isElementInView: boolean,
    pagingObj: Paging,
    isFeedLoading: boolean
  ) => {
    if (isElementInView && pagingObj?.after && !isFeedLoading) {
      fetchActivityFeed(pagingObj.after);
    }
  };

  useEffect(() => {
    getEntityFeedCount();
  }, []);

  useEffect(() => {
    if (!isMounting.current && appState.inPageSearchText) {
      history.push(
        `${getExplorePathWithSearch(
          appState.inPageSearchText
        )}?database=${databaseSchemaName}&service_type=${serviceType}`
      );
    }
  }, [appState.inPageSearchText]);

  useEffect(() => {
    const currentTab = getCurrentDatabaseDetailsTab(tab);
    const currentTabIndex = currentTab - 1;

    if (tabs[currentTabIndex].isProtected) {
      activeTabHandler(1);
    }
    getDetailsByFQN();
  }, []);

  useEffect(() => {
    if (TabSpecificField.ACTIVITY_FEED === tab) {
      fetchActivityFeed();
    } else {
      setEntityThread([]);
    }
  }, [tab]);

  useEffect(() => {
    fetchMoreFeed(isInView as boolean, paging, isentityThreadLoading);
  }, [isInView, paging, isentityThreadLoading]);

  // alwyas Keep this useEffect at the end...
  useEffect(() => {
    isMounting.current = false;
    appState.inPageSearchText = '';
  }, []);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <ErrorPlaceHolder>
          <p data-testid="error-message">{error}</p>
        </ErrorPlaceHolder>
      ) : (
        <PageContainer>
          <div
            className="tw-px-6 tw-w-full tw-h-full tw-flex tw-flex-col"
            data-testid="page-container">
            <TitleBreadcrumb titleLinks={slashedTableName} />

            <div className="tw-flex tw-gap-1 tw-mb-2 tw-mt-1 tw-ml-7 tw-flex-wrap">
              {extraInfo.map((info, index) => (
                <span className="tw-flex" key={index}>
                  {getInfoElements(info)}
                  {extraInfo.length !== 1 && index < extraInfo.length - 1 ? (
                    <span className="tw-mx-1.5 tw-inline-block tw-text-gray-400">
                      |
                    </span>
                  ) : null}
                </span>
              ))}
            </div>

            <div className="tw-pl-2" data-testid="description-container">
              <Description
                blurWithBodyBG
                description={description}
                entityFieldThreads={getEntityFieldThreadCounts(
                  'description',
                  entityFieldThreadCount
                )}
                entityFqn={databaseSchemaFQN}
                entityName={databaseSchemaName}
                entityType={EntityType.DATABASE}
                isEdit={isEdit}
                onCancel={onCancel}
                onDescriptionEdit={onDescriptionEdit}
                onDescriptionUpdate={onDescriptionUpdate}
                onEntityFieldSelect={onEntityFieldSelect}
                onThreadLinkSelect={onThreadLinkSelect}
              />
            </div>
            <div className="tw-mt-4 tw-flex tw-flex-col tw-flex-grow">
              <TabsPane
                activeTab={activeTab}
                className="tw-flex-initial"
                setActiveTab={activeTabHandler}
                tabs={tabs}
              />
              <div className="tw-bg-white tw-flex-grow tw--mx-6 tw-px-7 tw-py-4">
                {activeTab === 1 && (
                  <Fragment>
                    <table
                      className="tw-bg-white tw-w-full tw-mb-4"
                      data-testid="database-tables">
                      <thead data-testid="table-header">
                        <tr className="tableHead-row">
                          <th
                            className="tableHead-cell"
                            data-testid="header-name">
                            Table Name
                          </th>
                          <th
                            className="tableHead-cell"
                            data-testid="header-description">
                            Description
                          </th>
                          <th
                            className="tableHead-cell"
                            data-testid="header-owner">
                            Owner
                          </th>
                          <th
                            className="tableHead-cell"
                            data-testid="header-usage">
                            Usage
                          </th>
                          <th
                            className="tableHead-cell tw-w-60"
                            data-testid="header-tags">
                            Tags
                          </th>
                        </tr>
                      </thead>
                      <tbody className="tableBody">
                        {tableData.length > 0 ? (
                          tableData.map((table, index) => (
                            <tr
                              className={classNames(
                                'tableBody-row',
                                !isEven(index + 1) ? 'odd-row' : null
                              )}
                              data-testid="tabale-column"
                              key={index}>
                              <td className="tableBody-cell">
                                <Link
                                  to={
                                    table.fullyQualifiedName
                                      ? getTableDetailsPath(
                                          table.fullyQualifiedName
                                        )
                                      : ''
                                  }>
                                  {table.name}
                                </Link>
                              </td>
                              <td className="tableBody-cell">
                                {table.description?.trim() ? (
                                  <RichTextEditorPreviewer
                                    markdown={table.description}
                                  />
                                ) : (
                                  <span className="tw-no-description">
                                    No description
                                  </span>
                                )}
                              </td>
                              <td className="tableBody-cell">
                                <p>
                                  {getOwnerFromId(table?.owner?.id)
                                    ?.displayName ||
                                    getOwnerFromId(table?.owner?.id)?.name ||
                                    '--'}
                                </p>
                              </td>
                              <td className="tableBody-cell">
                                <p>
                                  {getUsagePercentile(
                                    table.usageSummary?.weeklyStats
                                      ?.percentileRank || 0
                                  )}
                                </p>
                              </td>
                              <td className="tableBody-cell">
                                <TagsViewer
                                  sizeCap={-1}
                                  tags={(table.tags || []).map((tag) => ({
                                    ...tag,
                                    tagFQN: tag.tagFQN?.startsWith(
                                      `Tier${FQN_SEPARATOR_CHAR}Tier`
                                    )
                                      ? tag.tagFQN.split(FQN_SEPARATOR_CHAR)[1]
                                      : tag.tagFQN,
                                  }))}
                                />
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="tableBody-row">
                            <td
                              className="tableBody-cell tw-text-center"
                              colSpan={5}>
                              No records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {Boolean(
                      !isNil(tablePaging.after) || !isNil(tablePaging.before)
                    ) && (
                      <NextPrevious
                        paging={tablePaging}
                        pagingHandler={tablePagingHandler}
                      />
                    )}
                  </Fragment>
                )}
                {activeTab === 2 && (
                  <div
                    className="tw-py-4 tw-px-7 tw-grid tw-grid-cols-3 entity-feed-list tw--mx-7 tw--my-4"
                    id="activityfeed">
                    <div />
                    <ActivityFeedList
                      isEntityFeed
                      withSidePanel
                      className=""
                      deletePostHandler={deletePostHandler}
                      entityName={databaseSchemaName}
                      feedList={entityThread}
                      postFeedHandler={postFeedHandler}
                    />
                    <div />
                  </div>
                )}
                {activeTab === 3 && (
                  <ManageTabComponent
                    hideTier
                    currentUser={database?.owner?.id}
                    hasEditAccess={hasEditAccess(
                      database?.owner?.type || '',
                      database?.owner?.id || ''
                    )}
                    onSave={handleUpdateOwner}
                  />
                )}
                <div
                  data-testid="observer-element"
                  id="observer-element"
                  ref={elementRef as RefObject<HTMLDivElement>}>
                  {getLoader()}
                </div>
              </div>
            </div>
            {threadLink ? (
              <ActivityThreadPanel
                createThread={createThread}
                deletePostHandler={deletePostHandler}
                open={Boolean(threadLink)}
                postFeedHandler={postFeedHandler}
                threadLink={threadLink}
                onCancel={onThreadPanelClose}
              />
            ) : null}
            {selectedField ? (
              <RequestDescriptionModal
                createThread={createThread}
                defaultValue={getDefaultValue(
                  database?.owner as EntityReference
                )}
                header="Request description"
                threadLink={getEntityFeedLink(
                  EntityType.DATABASE,
                  databaseSchemaFQN,
                  selectedField
                )}
                onCancel={closeRequestModal}
              />
            ) : null}
          </div>
        </PageContainer>
      )}
    </>
  );
};

export default observer(DatabaseSchemaPage);
