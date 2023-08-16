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

import { Button, Space, Typography } from 'antd';
import classNames from 'classnames';
import { isUndefined } from 'lodash';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getFrontEndFormat,
  MarkdownToHTMLConverter,
} from '../../../../utils/FeedUtils';
import { getDateTimeByTimeStamp } from '../../../../utils/TimeUtils';
import RichTextEditorPreviewer from '../../../common/rich-text-editor/RichTextEditorPreviewer';
import Reactions from '../../../Reactions/Reactions';
import ActivityFeedEditor from '../../ActivityFeedEditor/ActivityFeedEditor';
import { FeedBodyProp } from '../ActivityFeedCard.interface';

const FeedCardBody: FC<FeedBodyProp> = ({
  message,
  announcementDetails,
  className,
  reactions,
  onReactionSelect,
  isEditPost,
  onPostUpdate,
  onCancelPostUpdate,
}) => {
  const { t } = useTranslation();
  const [postMessage, setPostMessage] = useState<string>(message);

  const handleMessageUpdate = (updatedMessage: string) => {
    setPostMessage(updatedMessage);
  };

  const handleSave = () => {
    onPostUpdate(postMessage);
  };

  const getDefaultValue = (defaultMessage: string) => {
    return MarkdownToHTMLConverter.makeHtml(getFrontEndFormat(defaultMessage));
  };

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onCancelPostUpdate();
    setPostMessage(getDefaultValue(message));
  };

  const FEED_BODY = useMemo(
    () =>
      isEditPost ? (
        <ActivityFeedEditor
          defaultValue={getDefaultValue(message)}
          editAction={
            <div className="d-flex">
              <Button
                data-testid="cancel-button"
                size="small"
                onClick={handleCancel}>
                {t('label.cancel')}
              </Button>
              <Button
                data-testid="save-button"
                disabled={!postMessage.length}
                size="small"
                type="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}>
                {t('label.save')}
              </Button>
            </div>
          }
          editorClass="is_edit_post"
          onSave={handleSave}
          onTextChange={handleMessageUpdate}
        />
      ) : (
        <RichTextEditorPreviewer
          className="activity-feed-card-text"
          markdown={getFrontEndFormat(postMessage)}
        />
      ),
    [isEditPost, message, postMessage]
  );

  useEffect(() => {
    setPostMessage(message);
  }, [message]);

  return (
    <>
      <div className={classNames('feed-message', isEditPost ? '' : className)}>
        {!isUndefined(announcementDetails) ? (
          <Space direction="vertical" size={4}>
            <Typography.Text className="feed-body-schedule text-xs text-grey-muted">
              {t('label.schedule')}{' '}
              {getDateTimeByTimeStamp(announcementDetails.startTime * 1000)}{' '}
              {t('label.to-lowercase')}{' '}
              {getDateTimeByTimeStamp(announcementDetails.endTime * 1000)}
            </Typography.Text>
            <Typography.Text className="font-medium">
              {postMessage}
            </Typography.Text>
            <RichTextEditorPreviewer
              className="activity-feed-card-text"
              markdown={announcementDetails.description || ''}
            />
          </Space>
        ) : (
          FEED_BODY
        )}
      </div>
      {Boolean(reactions?.length) && (
        <Reactions
          reactions={reactions || []}
          onReactionSelect={onReactionSelect}
        />
      )}
    </>
  );
};

export default FeedCardBody;
