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

import { Button, Col, Row, Space, Typography } from 'antd';
import classNames from 'classnames';
import { isUndefined } from 'lodash';
import React, {
  FC,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { confirmStateInitialValue } from '../../../constants/feed.constants';
import { FeedFilter } from '../../../enums/mydata.enum';
import { Thread, ThreadType } from '../../../generated/entity/feed/thread';
import { withLoader } from '../../../hoc/withLoader';
import { getFeedListWithRelativeDays } from '../../../utils/FeedUtils';
import { dropdownIcon as DropDownIcon } from '../../../utils/svgconstant';
import DropDownList from '../../dropdown/DropDownList';
import { ConfirmState } from '../ActivityFeedCard/ActivityFeedCard.interface';
import ActivityFeedPanel from '../ActivityFeedPanel/ActivityFeedPanel';
import DeleteConfirmationModal from '../DeleteConfirmationModal/DeleteConfirmationModal';
import NoFeedPlaceholder from '../NoFeedPlaceholder/NoFeedPlaceholder';
import { ActivityFeedListProp } from './ActivityFeedList.interface';
import './ActivityFeedList.less';
import {
  filterList,
  getFeedFilterDropdownIcon,
  getThreadFilterDropdownIcon,
  threadFilterList,
} from './ActivityFeedList.util';
import FeedListBody from './FeedListBody';
import FeedListSeparator from './FeedListSeparator';

const ActivityFeedList: FC<ActivityFeedListProp> = ({
  className,
  feedList,
  refreshFeedCount,
  onRefreshFeeds,
  withSidePanel = false,
  isEntityFeed = false,
  postFeedHandler,
  entityName,
  deletePostHandler,
  updateThreadHandler,
  onFeedFiltersUpdate,
  hideFeedFilter,
  hideThreadFilter,
  stickyFilter,
}) => {
  const { updatedFeedList, relativeDays } =
    getFeedListWithRelativeDays(feedList);
  const [selectedThread, setSelectedThread] = useState<Thread>();
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

  const [confirmationState, setConfirmationState] = useState<ConfirmState>(
    confirmStateInitialValue
  );
  const [fieldListVisible, setFieldListVisible] = useState<boolean>(false);
  const [showThreadTypeList, setShowThreadTypeList] = useState<boolean>(false);
  const [feedFilter, setFeedFilter] = useState<FeedFilter>(FeedFilter.ALL);
  const [threadType, setThreadType] = useState<ThreadType>();

  const handleDropDown = useCallback(
    (_e: React.MouseEvent<HTMLElement, MouseEvent>, value?: string) => {
      const feedType = (value as FeedFilter) || FeedFilter.ALL;
      setFeedFilter(feedType);
      setFieldListVisible(false);
      onFeedFiltersUpdate && onFeedFiltersUpdate(feedType, threadType);
    },
    [setFeedFilter, setFieldListVisible, onFeedFiltersUpdate, threadType]
  );

  const onDiscard = () => {
    setConfirmationState(confirmStateInitialValue);
  };

  const onPostDelete = () => {
    if (confirmationState.postId && confirmationState.threadId) {
      deletePostHandler?.(
        confirmationState.threadId,
        confirmationState.postId,
        confirmationState.isThread
      );
    }
    onDiscard();
  };

  const onConfirmation = (data: ConfirmState) => {
    setConfirmationState(data);
  };

  const onThreadIdSelect = (id: string) => {
    setSelectedThreadId(id);
    setSelectedThread(undefined);
  };

  const onThreadIdDeselect = () => {
    setSelectedThreadId('');
  };

  const onThreadSelect = (id: string) => {
    const thread = feedList.find((f) => f.id === id);
    if (thread) {
      setSelectedThread(thread);
    }
  };

  const onViewMore = () => {
    setIsPanelOpen(true);
  };

  const onCancel = () => {
    setSelectedThread(undefined);
    setIsPanelOpen(false);
  };

  const postFeed = (value: string) => {
    postFeedHandler?.(value, selectedThread?.id ?? selectedThreadId);
  };

  // Thread filter change handler
  const handleThreadTypeDropDownChange = useCallback(
    (_e: React.MouseEvent<HTMLElement, MouseEvent>, value?: string) => {
      const threadType =
        value === 'ALL' ? undefined : (value as ThreadType) ?? undefined;
      setThreadType(threadType);
      setShowThreadTypeList(false);
      onFeedFiltersUpdate && onFeedFiltersUpdate(feedFilter, threadType);
    },
    [feedFilter, onFeedFiltersUpdate, setThreadType, setShowThreadTypeList]
  );

  const feedFilterList = useMemo(
    () =>
      isEntityFeed
        ? filterList.filter((f) => f.value === 'ALL' || f.value === 'MENTIONS')
        : filterList.slice(),
    [isEntityFeed]
  );

  const getFilterDropDown = () => {
    return hideFeedFilter && hideThreadFilter ? null : (
      <Row className="filters-container" justify="space-between">
        {/* Feed filter */}
        <Col>
          {!hideFeedFilter && (
            <>
              <Button
                data-testid="feeds"
                icon={getFeedFilterDropdownIcon(feedFilter)}
                type="link"
                onClick={() => setFieldListVisible((visible) => !visible)}>
                <Space>
                  <Typography.Text className="font-normal text-primary m-l-xss">
                    {feedFilterList.find((f) => f.value === feedFilter)?.name}
                  </Typography.Text>
                  <DropDownIcon className="dropdown-icon" />
                </Space>
              </Button>
              {fieldListVisible && (
                <DropDownList
                  dropDownList={feedFilterList}
                  value={feedFilter}
                  onSelect={handleDropDown}
                />
              )}
            </>
          )}
        </Col>
        {/* Thread filter */}
        <Col>
          {!hideThreadFilter && (
            <>
              <Button
                data-testid="thread-filter"
                icon={getThreadFilterDropdownIcon(threadType ?? 'ALL')}
                type="link"
                onClick={() => setShowThreadTypeList((visible) => !visible)}>
                <Space>
                  <Typography.Text className="font-normal text-primary m-l-xss">
                    {
                      threadFilterList.find(
                        (f) => f.value === (threadType ?? 'ALL')
                      )?.name
                    }
                  </Typography.Text>
                  <DropDownIcon className="dropdown-icon" />
                </Space>
              </Button>
              {showThreadTypeList && (
                <DropDownList
                  horzPosRight
                  dropDownList={threadFilterList}
                  value={threadType}
                  onSelect={handleThreadTypeDropDownChange}
                />
              )}
            </>
          )}
        </Col>
      </Row>
    );
  };

  useEffect(() => {
    onThreadSelect(selectedThread?.id ?? selectedThreadId);
  }, [feedList]);

  useEffect(() => {
    const escapeKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', escapeKeyHandler);

    return () => {
      document.removeEventListener('keydown', escapeKeyHandler);
    };
  }, []);

  return (
    <div className={classNames(className, 'feed-list-container')} id="feedData">
      <div className={stickyFilter ? 'filters-wrapper' : ''}>
        {feedList.length === 0 && feedFilter === FeedFilter.ALL && !threadType
          ? null
          : getFilterDropDown()}
      </div>
      {refreshFeedCount ? (
        <div className="tw-py-px tw-pt-3 tw-pb-3">
          <button className="tw-refreshButton " onClick={onRefreshFeeds}>
            View {refreshFeedCount} new{' '}
            {refreshFeedCount > 1 ? 'activities' : 'activity'}
          </button>
        </div>
      ) : null}
      {feedList.length > 0 ? (
        <Fragment>
          {relativeDays.map((d, i) => {
            return (
              <div data-testid={`feed${i}`} key={i}>
                <FeedListBody
                  deletePostHandler={deletePostHandler}
                  isEntityFeed={isEntityFeed}
                  postFeed={postFeed}
                  relativeDay={d}
                  selectedThreadId={selectedThreadId}
                  updateThreadHandler={updateThreadHandler}
                  updatedFeedList={updatedFeedList}
                  withSidePanel={withSidePanel}
                  onConfirmation={onConfirmation}
                  onThreadIdDeselect={onThreadIdDeselect}
                  onThreadIdSelect={onThreadIdSelect}
                  onThreadSelect={onThreadSelect}
                  onViewMore={onViewMore}
                />
              </div>
            );
          })}
          {withSidePanel && selectedThread && isPanelOpen ? (
            <Fragment>
              <ActivityFeedPanel
                deletePostHandler={deletePostHandler}
                open={!isUndefined(selectedThread) && isPanelOpen}
                postFeed={postFeed}
                selectedThread={selectedThread}
                updateThreadHandler={updateThreadHandler}
                onCancel={onCancel}
              />
            </Fragment>
          ) : null}
        </Fragment>
      ) : (
        <Fragment>
          {entityName && feedFilter === FeedFilter.ALL && !threadType ? (
            <NoFeedPlaceholder entityName={entityName} />
          ) : !refreshFeedCount ? (
            <Fragment>
              <FeedListSeparator
                className="tw-relative tw-mt-1 tw-mb-3.5 tw-pb-5"
                relativeDay=""
              />
              <>No conversations found. Try changing the filter.</>
            </Fragment>
          ) : null}
        </Fragment>
      )}
      {confirmationState.state && (
        <DeleteConfirmationModal
          onDelete={onPostDelete}
          onDiscard={onDiscard}
        />
      )}
    </div>
  );
};

export default withLoader<ActivityFeedListProp>(ActivityFeedList);
