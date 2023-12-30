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
import { Col, Row, Space, Steps, Typography } from 'antd';
import { last, toLower } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NO_DATA_PLACEHOLDER } from '../../../constants/constants';
import { Thread } from '../../../generated/entity/feed/thread';
import { TestCaseResolutionStatusTypes } from '../../../generated/tests/testCase';
import { formatDateTime } from '../../../utils/date-time/DateTimeUtils';
import { getEntityName } from '../../../utils/EntityUtils';
import { useActivityFeedProvider } from '../../ActivityFeed/ActivityFeedProvider/ActivityFeedProvider';
import AssigneeList from '../../common/AssigneeList/AssigneeList';
import { OwnerLabel } from '../../common/OwnerLabel/OwnerLabel.component';
import RichTextEditorPreviewer from '../../common/RichTextEditor/RichTextEditorPreviewer';
import Severity from '../../IncidentManager/Severity/Severity.component';
import './task-tab-incident-manager-header.style.less';

const TaskTabIncidentManagerHeader = ({ thread }: { thread: Thread }) => {
  const { t } = useTranslation();
  const { testCaseResolutionStatus } = useActivityFeedProvider();
  const testCaseResolutionStepper = useMemo(
    () =>
      testCaseResolutionStatus.map((status) => {
        const assigneeDetail =
          TestCaseResolutionStatusTypes.Assigned ===
          status.testCaseResolutionStatusType ? (
            <Typography.Text className="text-grey-muted text-xss">
              {`To ${getEntityName(
                status.testCaseResolutionStatusDetails?.assignee
              )} on `}
            </Typography.Text>
          ) : null;

        const resolvedDetail =
          TestCaseResolutionStatusTypes.Resolved ===
            status.testCaseResolutionStatusType &&
          status.testCaseResolutionStatusDetails?.resolvedBy ? (
            <Typography.Text className="text-grey-muted text-xss">
              {`By ${getEntityName(
                status.testCaseResolutionStatusDetails.resolvedBy
              )} on `}
            </Typography.Text>
          ) : null;

        return {
          className: toLower(status.testCaseResolutionStatusType),
          title: (
            <div>
              <Typography.Paragraph className="m-b-0">
                {status.testCaseResolutionStatusType}
              </Typography.Paragraph>
              <Typography.Paragraph className="m-b-0">
                {assigneeDetail}
                {resolvedDetail}
                <Typography.Text className="text-grey-muted text-xss">
                  {formatDateTime(status.updatedAt)}
                </Typography.Text>
              </Typography.Paragraph>
            </div>
          ),
          key: status.testCaseResolutionStatusType,
        };
      }),
    [testCaseResolutionStatus]
  );

  const latestTestCaseResolutionStatus = useMemo(
    () => last(testCaseResolutionStatus),
    [testCaseResolutionStatus]
  );

  const isResolved =
    latestTestCaseResolutionStatus?.testCaseResolutionStatusType ===
    TestCaseResolutionStatusTypes.Resolved;

  return (
    <Row data-testid="incident-manager-task-header-container" gutter={[8, 16]}>
      <Col span={24}>
        <div className="task-resolution-steps-container">
          <Steps
            className="task-resolution-steps w-full"
            current={testCaseResolutionStatus.length}
            data-testid="task-resolution-steps"
            items={testCaseResolutionStepper}
            labelPlacement="vertical"
            size="small"
          />
        </div>
      </Col>
      <Col span={24}>
        <Space className="justify-between w-full">
          <div className="gap-2 flex-center">
            <Typography.Text className="text-grey-muted">
              {`${t('label.assignee')}: `}
            </Typography.Text>
            <AssigneeList assignees={thread.task?.assignees ?? []} />
          </div>
          <div className="gap-2 flex-center">
            <Typography.Text className="text-grey-muted">
              {`${t('label.created-by')}: `}
            </Typography.Text>
            <OwnerLabel
              owner={{ name: thread.createdBy, type: 'user', id: '' }}
            />
          </div>
        </Space>
      </Col>
      <Col span={24}>
        <Space className="justify-between w-full">
          <div className="gap-2 flex-center">
            <Typography.Text className="text-grey-muted">
              {`${t('label.severity')}: `}
            </Typography.Text>
            <Severity severity={latestTestCaseResolutionStatus?.severity} />
          </div>
          {isResolved && (
            <div className="gap-2 flex-center" data-testid="failure-reason">
              <Typography.Text className="text-grey-muted">
                {`${t('label.failure-reason')}: `}
              </Typography.Text>
              {latestTestCaseResolutionStatus?.testCaseResolutionStatusDetails
                ?.testCaseFailureReason ?? NO_DATA_PLACEHOLDER}
            </div>
          )}
        </Space>
      </Col>
      {isResolved && (
        <Col span={24}>
          <Typography.Text className="text-grey-muted">
            {`${t('label.failure-comment')}: `}
          </Typography.Text>
          <RichTextEditorPreviewer
            markdown={
              latestTestCaseResolutionStatus?.testCaseResolutionStatusDetails
                ?.testCaseFailureComment ?? ''
            }
          />
        </Col>
      )}
    </Row>
  );
};

export default TaskTabIncidentManagerHeader;
