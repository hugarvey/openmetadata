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
import { Button, Col, Row, Typography } from 'antd';
import classNames from 'classnames';
import ActivityFeedEditor from 'components/ActivityFeed/ActivityFeedEditor/ActivityFeedEditor';
import RichTextEditorPreviewer from 'components/common/rich-text-editor/RichTextEditorPreviewer';
import Reactions from 'components/Reactions/Reactions';
import { Thread } from 'generated/entity/feed/thread';
import { isUndefined, noop } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getFrontEndFormat, MarkdownToHTMLConverter } from 'utils/FeedUtils';
import { getDateTimeByTimeStamp } from 'utils/TimeUtils';

interface FeedCardBodyProps {
  isEditPost: boolean;
  feed: Thread;
  className?: string;
  showSchedule?: boolean;
}

const FeedCardBodyV1 = ({
  isEditPost,
  className,
  showSchedule = true,
  feed: { message, announcement, reactions },
}: FeedCardBodyProps) => {
  const { t } = useTranslation();
  const getDefaultValue = (defaultMessage: string) => {
    return MarkdownToHTMLConverter.makeHtml(getFrontEndFormat(defaultMessage));
  };

  const feedBody = useMemo(
    () =>
      isEditPost ? (
        <ActivityFeedEditor
          defaultValue={getDefaultValue(message)}
          editAction={
            <div className="d-flex justify-end gap-2 m-r-xss">
              <Button
                className="border border-primary text-primary rounded-4"
                data-testid="cancel-button"
                size="small"
                onClick={noop}>
                {t('label.cancel')}
              </Button>
              <Button
                className="rounded-4"
                data-testid="save-button"
                disabled={!message.length}
                size="small"
                type="primary"
                onClick={noop}>
                {t('label.save')}
              </Button>
            </div>
          }
          editorClass="is_edit_post"
          onSave={noop}
          onTextChange={noop}
        />
      ) : (
        <RichTextEditorPreviewer
          className="activity-feed-card-v1-text"
          markdown={getFrontEndFormat(message)}
        />
      ),
    [isEditPost, message]
  );

  return (
    <div className={classNames('feed-card-body', isEditPost ? '' : className)}>
      <div className="feed-meesage">
        {!isUndefined(announcement) ? (
          <>
            <Row>
              <Col span={24}>
                {showSchedule && (
                  <Typography.Text className="feed-body-schedule text-xs text-grey-muted">
                    {t('label.schedule')}{' '}
                    {getDateTimeByTimeStamp(announcement.startTime * 1000)}{' '}
                    {t('label.to-lowercase')}{' '}
                    {getDateTimeByTimeStamp(announcement.endTime * 1000)}
                  </Typography.Text>
                )}
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Typography.Text className="font-semibold">
                  {message}
                </Typography.Text>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <RichTextEditorPreviewer
                  className="activity-feed-card-v1-text"
                  markdown={announcement.description ?? ''}
                />
              </Col>
            </Row>
          </>
        ) : (
          feedBody
        )}
      </div>
      {Boolean(reactions?.length) && (
        <Reactions reactions={reactions ?? []} onReactionSelect={noop} />
      )}
    </div>
  );
};

export default FeedCardBodyV1;
