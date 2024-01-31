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

import { AxiosError } from 'axios';
import { compare, Operation } from 'fast-json-patch';
import { isEmpty, isEqual, orderBy } from 'lodash';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
  PAGE_SIZE_LARGE,
  PAGE_SIZE_MEDIUM,
} from '../../../constants/constants';
import { EntityType } from '../../../enums/entity.enum';
import { FeedFilter } from '../../../enums/mydata.enum';
import { ReactionOperation } from '../../../enums/reactions.enum';
import { CreateThread } from '../../../generated/api/feed/createThread';
import {
  AnnouncementDetails,
  Post,
  TaskType,
  Thread,
  ThreadTaskStatus,
  ThreadType,
} from '../../../generated/entity/feed/thread';
import { EntityReference } from '../../../generated/entity/type';
import { TestCaseResolutionStatus } from '../../../generated/tests/testCaseResolutionStatus';
import { Paging } from '../../../generated/type/paging';
import { Reaction, ReactionType } from '../../../generated/type/reaction';
import {
  deletePostById,
  deleteThread,
  getAllFeeds,
  getFeedById,
  postFeedById,
  postThread,
  updatePost,
  updateThread,
} from '../../../rest/feedsAPI';
import { getListTestCaseIncidentByStateId } from '../../../rest/incidentManagerAPI';
import { getUsers } from '../../../rest/userAPI';
import {
  getEntityFeedLink,
  getEntityReferenceListFromEntities,
} from '../../../utils/EntityUtils';
import { getUpdatedThread } from '../../../utils/FeedUtils';
import { showErrorToast, showSuccessToast } from '../../../utils/ToastUtils';
import { useAuthContext } from '../../Auth/AuthProviders/AuthProvider';
import EditAnnouncementModal from '../../Modals/AnnouncementModal/EditAnnouncementModal';
import ActivityFeedDrawer from '../ActivityFeedDrawer/ActivityFeedDrawer';
import { ActivityFeedProviderContextType } from './ActivityFeedProviderContext.interface';

interface Props {
  children: ReactNode;
  // To override current userId in case of User profile page
  // Will update logic to ser userID from props later
  user?: string;
}

export const ActivityFeedContext = createContext(
  {} as ActivityFeedProviderContextType
);

const ActivityFeedProvider = ({ children, user }: Props) => {
  const { t } = useTranslation();
  const [entityThread, setEntityThread] = useState<Thread[]>([]);
  const [entityPaging, setEntityPaging] = useState<Paging>({} as Paging);
  const [focusReplyEditor, setFocusReplyEditor] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditAnnouncement, setIsEditAnnouncement] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread>();
  const [testCaseResolutionStatus, setTestCaseResolutionStatus] = useState<
    TestCaseResolutionStatus[]
  >([]);
  const [initialAssignees, setInitialAssignees] = useState<EntityReference[]>(
    []
  );
  const { currentUser } = useAuthContext();

  const fetchTestCaseResolution = useCallback(async (id: string) => {
    try {
      const { data } = await getListTestCaseIncidentByStateId(id, {
        limit: PAGE_SIZE_LARGE,
      });

      setTestCaseResolutionStatus(
        orderBy(data, (item) => item.timestamp, ['asc'])
      );
    } catch (error) {
      setTestCaseResolutionStatus([]);
    }
  }, []);

  const setActiveThread = useCallback((active?: Thread) => {
    setSelectedThread(active);
    if (
      active &&
      active.task?.type === TaskType.RequestTestCaseFailureResolution &&
      active.task?.testCaseResolutionStatusId
    ) {
      setLoading(true);
      fetchTestCaseResolution(active.task.testCaseResolutionStatusId).finally(
        () => {
          setLoading(false);
        }
      );
    }
  }, []);

  const getFeedDataById = useCallback(async (id) => {
    try {
      setIsDrawerLoading(true);
      const res = await getFeedById(id);
      setSelectedThread(res.data);
    } catch (err) {
      showErrorToast(
        err as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.message-plural-lowercase'),
        })
      );
    } finally {
      setIsDrawerLoading(false);
    }
  }, []);

  const fetchUpdatedThread = useCallback(
    async (id) => {
      try {
        const res = await getFeedById(id);
        setSelectedThread(res.data);
        setEntityThread((prev) => {
          return prev.map((thread) => {
            if (thread.id === id) {
              return res.data;
            } else {
              return thread;
            }
          });
        });
      } catch (err) {
        // no need to show error toast
      }
    },
    [setEntityThread]
  );

  const getFeedData = useCallback(
    async (
      filterType?: FeedFilter,
      after?: string,
      type?: ThreadType,
      entityType?: EntityType,
      fqn?: string,
      status?: ThreadTaskStatus
    ) => {
      try {
        setLoading(true);
        const feedFilterType = filterType ?? FeedFilter.ALL;
        const userId =
          entityType === EntityType.USER
            ? user
            : feedFilterType === FeedFilter.ALL
            ? undefined
            : currentUser?.id;

        const { data, paging } = await getAllFeeds(
          entityType !== EntityType.USER && fqn
            ? getEntityFeedLink(entityType, fqn)
            : undefined,
          after,
          type,
          feedFilterType,
          status,
          userId
        );
        setEntityThread((prev) => (after ? [...prev, ...data] : [...data]));
        setEntityPaging(paging);
        setActiveThread(undefined);
      } catch (err) {
        showErrorToast(
          err as AxiosError,
          t('server.entity-fetch-error', {
            entity: t('label.activity-feed'),
          })
        );
      } finally {
        setLoading(false);
      }
    },
    [currentUser, user]
  );

  const createThread = useCallback(async (data: CreateThread) => {
    const isAnnouncementThread = !isEmpty(data.announcementDetails);
    try {
      const res = await postThread(data);

      setEntityThread((prev) => [res, ...prev]);
      if (isAnnouncementThread && res) {
        showSuccessToast(t('message.announcement-created-successfully'));
      }
    } catch (error) {
      if (isAnnouncementThread) {
        showErrorToast(error as AxiosError);
      } else {
        showErrorToast(
          error as AxiosError,
          t('server.create-entity-error', {
            entity: t('label.conversation'),
          })
        );
      }
    }
  }, []);

  // Here value is the post message and id can be thread id or post id.
  const postFeed = useCallback(async (value: string, id: string) => {
    if (!currentUser) {
      return;
    }

    const data = {
      message: value,
      from: currentUser.name,
    } as Post;

    try {
      const res = await postFeedById(id, data);
      const { id: responseId, posts } = res;
      setEntityThread((pre) => {
        return pre.map((thread) => {
          if (thread.id === responseId) {
            return { ...res, posts: posts?.slice(-3) };
          } else {
            return thread;
          }
        });
      });
      setActiveThread(res);
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        t('server.add-entity-error', {
          entity: t('label.feed-plural'),
        })
      );
    }
  }, []);

  const refreshActivityFeed = useCallback((threads) => {
    setEntityThread([...threads]);
  }, []);

  const deleteFeed = useCallback(
    async (threadId: string, postId: string, isThread: boolean) => {
      if (isThread) {
        const data = await deleteThread(threadId);
        setEntityThread((prev) =>
          prev.filter((thread) => thread.id !== data.id)
        );
      } else {
        const deleteResponse = await deletePostById(threadId, postId);
        if (deleteResponse) {
          const data = await getUpdatedThread(threadId);
          setEntityThread((pre) => {
            return pre.map((thread) => {
              if (thread.id === data.id) {
                return {
                  ...thread,
                  posts: data.posts?.slice(-3),
                  postsCount: data.postsCount,
                };
              } else {
                return thread;
              }
            });
          });
          setActiveThread(data);
        }
      }
    },
    []
  );

  const updateThreadHandler = useCallback(
    async (threadId: string, data: Operation[]) => {
      try {
        const res = await updateThread(threadId, data);
        setEntityThread((prevData) => {
          return prevData.map((thread) => {
            if (isEqual(threadId, thread.id)) {
              return {
                ...thread,
                reactions: res.reactions,
                message: res.message,
                announcement: res?.announcement,
              };
            } else {
              return thread;
            }
          });
        });
      } catch (err) {
        showErrorToast(err as AxiosError);
      }
    },
    []
  );

  const updatePostHandler = useCallback(
    async (threadId: string, postId: string, data: Operation[]) => {
      try {
        const res = await updatePost(threadId, postId, data);
        const activeThreadData = await getFeedById(threadId);
        setEntityThread((prevData) => {
          return prevData.map((thread) => {
            if (isEqual(threadId, thread.id)) {
              const updatedPosts = (thread.posts ?? []).map((post) => {
                if (isEqual(postId, post.id)) {
                  return {
                    ...post,
                    reactions: res.reactions,
                    message: res.message,
                  };
                } else {
                  return post;
                }
              });

              return { ...thread, posts: updatedPosts };
            } else {
              return thread;
            }
          });
        });
        setSelectedThread(activeThreadData.data);
      } catch (err) {
        showErrorToast(err as AxiosError);
      }
    },
    []
  );

  const updateFeed = useCallback(
    async (
      threadId: string,
      postId: string | undefined,
      isThread: boolean,
      data: Operation[]
    ) => {
      if (isThread) {
        updateThreadHandler(threadId, data).catch(() => {
          // ignore since error is displayed in toast in the parent promise.
        });
      } else {
        updatePostHandler(threadId, postId as string, data).catch(() => {
          // ignore since error is displayed in toast in the parent promise.
        });
      }
    },
    []
  );

  const updateAnnouncement = useCallback(
    (title: string, announcement: AnnouncementDetails) => {
      // EditAnnouncement modal will be open only for the thread.type === 'announcement'
      // i.e. selected thread will be always announcement type in this context
      const existingAnnouncement = {
        ...selectedThread,
      };

      const updatedAnnouncement = {
        ...selectedThread,
        message: title,
        announcement,
      };

      const patch = compare(existingAnnouncement, updatedAnnouncement);

      updateFeed(selectedThread?.id as string, undefined, true, patch).catch(
        () => {
          // ignore since error is displayed in toast in the parent promise.
        }
      );
      setIsEditAnnouncement(false);
    },
    [selectedThread]
  );

  const updateReactions = (
    post: Post,
    feedId: string,
    isThread: boolean,
    reactionType: ReactionType,
    reactionOperation: ReactionOperation
  ) => {
    let updatedReactions = post.reactions ?? [];
    if (reactionOperation === ReactionOperation.ADD) {
      const reactionObject = {
        reactionType,
        user: {
          id: currentUser?.id as string,
        },
      };

      updatedReactions = [...updatedReactions, reactionObject as Reaction];
    } else {
      updatedReactions = updatedReactions.filter(
        (reaction) =>
          !(
            reaction.reactionType === reactionType &&
            reaction.user.id === currentUser?.id
          )
      );
    }

    const patch = compare(
      { ...post, reactions: [...(post.reactions ?? [])] },
      {
        ...post,
        reactions: updatedReactions,
      }
    );

    updateFeed(feedId, post.id, isThread, patch).catch(() => {
      // ignore since error is displayed in toast in the parent promise.
    });
  };

  const updateEditorFocus = (isFocused: boolean) => {
    setFocusReplyEditor(isFocused);
  };

  const showDrawer = useCallback((thread: Thread) => {
    setIsDrawerOpen(true);
    getFeedDataById(thread.id).catch(() => {
      // ignore since error is displayed in toast in the parent promise.
    });
  }, []);

  const showEditAnnouncementModal = (thread: Thread) => {
    setActiveThread(thread);
    setIsEditAnnouncement(true);
  };

  const hideDrawer = useCallback(() => {
    setFocusReplyEditor(false);
    setIsDrawerOpen(false);
  }, []);

  const updateTestCaseIncidentStatus = useCallback(
    (status: TestCaseResolutionStatus[]) => {
      setTestCaseResolutionStatus(status);
    },
    [setTestCaseResolutionStatus]
  );
  const fetchInitialAssign = useCallback(async () => {
    try {
      const { data } = await getUsers({
        limit: PAGE_SIZE_MEDIUM,

        isBot: false,
      });
      const filterData = getEntityReferenceListFromEntities(
        data,
        EntityType.USER
      );
      setInitialAssignees(filterData);
    } catch (error) {
      setInitialAssignees([]);
    }
  }, []);

  useEffect(() => {
    // fetch users once and store in state
    fetchInitialAssign();
  }, []);

  const activityFeedContextValues = useMemo(() => {
    return {
      entityThread,
      selectedThread,
      isDrawerOpen,
      loading,
      isDrawerLoading,
      focusReplyEditor,
      refreshActivityFeed,
      deleteFeed,
      postFeed,
      updateFeed,
      updateReactions,
      getFeedData,
      showDrawer,
      hideDrawer,
      updateEditorFocus,
      setActiveThread,
      entityPaging,
      userId: user ?? currentUser?.id ?? '',
      testCaseResolutionStatus,
      fetchUpdatedThread,
      updateTestCaseIncidentStatus,
      showEditAnnouncementModal,
      updateAnnouncement,
      createThread,
      initialAssignees,
    };
  }, [
    entityThread,
    selectedThread,
    isDrawerOpen,
    loading,
    isDrawerLoading,
    focusReplyEditor,
    refreshActivityFeed,
    deleteFeed,
    postFeed,
    updateFeed,
    updateReactions,
    getFeedData,
    showDrawer,
    hideDrawer,
    updateEditorFocus,
    setActiveThread,
    entityPaging,
    user,
    currentUser,
    testCaseResolutionStatus,
    fetchUpdatedThread,
    updateTestCaseIncidentStatus,
    showEditAnnouncementModal,
    updateAnnouncement,
    createThread,
    initialAssignees,
  ]);

  return (
    <ActivityFeedContext.Provider value={activityFeedContextValues}>
      {children}
      {isDrawerOpen && (
        <>
          <ActivityFeedDrawer open={isDrawerOpen} />
        </>
      )}
      {isEditAnnouncement && selectedThread ? (
        <EditAnnouncementModal
          open={isEditAnnouncement}
          onCancel={() => setIsEditAnnouncement(false)}
        />
      ) : (
        <></>
      )}
    </ActivityFeedContext.Provider>
  );
};

export const useActivityFeedProvider = () => useContext(ActivityFeedContext);

export default ActivityFeedProvider;
