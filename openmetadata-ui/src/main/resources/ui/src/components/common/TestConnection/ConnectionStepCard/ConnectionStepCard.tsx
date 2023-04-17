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
import { InfoCircleOutlined } from '@ant-design/icons';
import { Collapse, Divider, Popover, Space, Typography } from 'antd';
import { ReactComponent as AttentionIcon } from 'assets/svg/attention.svg';
import { ReactComponent as FailIcon } from 'assets/svg/fail-badge.svg';
import { ReactComponent as SuccessIcon } from 'assets/svg/success-badge.svg';
import classNames from 'classnames';
import { TestConnectionStepResult } from 'generated/entity/automations/workflow';
import { TestConnectionStep } from 'generated/entity/services/connections/testConnectionDefinition';
import { isUndefined } from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { requiredField } from 'utils/CommonUtils';
import './ConnectionStepCard.less';

const { Panel } = Collapse;

interface ConnectionStepCardProp {
  testConnectionStep: TestConnectionStep;
  testConnectionStepResult: TestConnectionStepResult | undefined;
  isTestingConnection: boolean;
}

const ConnectionStepCard = ({
  testConnectionStep,
  testConnectionStepResult,
  isTestingConnection,
}: ConnectionStepCardProp) => {
  const { t } = useTranslation();
  const isSkipped =
    isUndefined(testConnectionStepResult) && !isTestingConnection;
  const hasPassed = !isSkipped && testConnectionStepResult?.passed;
  const success = hasPassed && !isTestingConnection;
  const failed = !isSkipped && !isTestingConnection && !hasPassed;
  const isMandatoryStepsFailing = failed && testConnectionStepResult?.mandatory;
  const isNonMandatoryStepsFailing =
    failed && !testConnectionStepResult?.mandatory;

  return (
    <div
      className={classNames('connection-step-card', {
        success: success,
        failure: isMandatoryStepsFailing,
        warning: isNonMandatoryStepsFailing,
      })}>
      <div
        className={classNames('connection-step-card-header', {
          success: success,
          failure: isMandatoryStepsFailing,
          warning: isNonMandatoryStepsFailing,
        })}>
        <Space className="w-full justify-between">
          <Space>
            <Typography.Text className="text-body text-600">
              {testConnectionStep.mandatory
                ? requiredField(testConnectionStep.name, true)
                : testConnectionStep.name}
            </Typography.Text>
            <Popover
              content={testConnectionStep.description}
              overlayStyle={{ maxWidth: '350px' }}
              placement="bottom"
              showArrow={false}
              trigger="hover">
              <InfoCircleOutlined />
            </Popover>
          </Space>
          {isTestingConnection && (
            <Typography.Text className="awaiting-status">
              {`${t('label.awaiting-status')}...`}
            </Typography.Text>
          )}
          {success && (
            <Space size={4}>
              <Typography.Text className="success-status">
                {`${t('label.success')}`}
              </Typography.Text>
              <SuccessIcon data-testid="success-badge" height={20} width={20} />
            </Space>
          )}
          {isMandatoryStepsFailing && (
            <Space size={4}>
              <Typography.Text className="failure-status">
                {`${t('label.failed')}`}
              </Typography.Text>
              <FailIcon data-testid="fail-badge" height={20} width={20} />
            </Space>
          )}
          {isNonMandatoryStepsFailing && (
            <Space align="center" size={4}>
              <Typography.Text className="warning-status">
                {`${t('label.attention')}`}
              </Typography.Text>
              <AttentionIcon
                data-testid="warning-badge"
                height={20}
                width={20}
              />
            </Space>
          )}
          {isSkipped && (
            <Space size={4}>
              <Typography.Text className="skipped-status">{`${t(
                'label.skipped'
              )}`}</Typography.Text>
            </Space>
          )}
        </Space>
      </div>
      {(isMandatoryStepsFailing || isNonMandatoryStepsFailing) && (
        <div className="connection-step-card-content">
          <Typography.Text className="text-body">
            {testConnectionStepResult?.message}
          </Typography.Text>
          {testConnectionStepResult?.errorLog && (
            <>
              <Divider className="connection-step-card-content-divider" />
              <Collapse ghost>
                <Panel
                  className="connection-step-card-content-logs"
                  header="Show logs"
                  key="show-log">
                  <p className="text-grey-muted">
                    {testConnectionStepResult?.errorLog ||
                      t('label.no-entity', { entity: t('label.log-plural') })}
                  </p>
                </Panel>
              </Collapse>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStepCard;
