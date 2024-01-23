/*
 *  Copyright 2024 Collate.
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

import { Button, Card, Col, Form, Row, Select, Typography } from 'antd';
import { startCase } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as PipelineIcon } from '../../../assets/svg/ic-pipeline.svg';
import { ReactComponent as ContainerIcon } from '../../../assets/svg/ic-storage.svg';
import { ReactComponent as TableIcon } from '../../../assets/svg/ic-table.svg';
import { ReactComponent as TopicIcon } from '../../../assets/svg/ic-topic.svg';
import { ReactComponent as IconTestSuite } from '../../../assets/svg/icon-test-suite.svg';
import { useFqn } from '../../../hooks/useFqn';
import './observability-form-trigger-item.less';
import { ObservabilityFormTriggerItemProps } from './ObservabilityFormTriggerItem.interface';

function ObservabilityFormTriggerItem({
  heading,
  subHeading,
  buttonLabel,
  filterResources,
}: Readonly<ObservabilityFormTriggerItemProps>) {
  const { t } = useTranslation();
  const form = Form.useFormInstance();
  const { fqn } = useFqn();
  const [selectedResource, setSelectedResource] = useState<string[]>([]);

  const [isEditMode, setIsEditMode] = useState(false);

  const getIconForEntity = (type: string) => {
    switch (type) {
      case 'container':
        return <ContainerIcon height={16} width={16} />;
      case 'pipeline':
        return <PipelineIcon height={16} width={16} />;
      case 'topic':
        return <TopicIcon height={16} width={16} />;
      case 'table':
        return <TableIcon height={16} width={16} />;
      case 'testCase':
      case 'testSuite':
        return <IconTestSuite height={16} width={16} />;
    }

    return null;
  };

  const handleAddTriggerClick = useCallback(() => {
    setIsEditMode(true);
  }, []);

  const resourcesOptions = useMemo(
    () =>
      filterResources.map((resource) => ({
        label: (
          <div className="d-flex items-center gap-2">
            {getIconForEntity(resource.name ?? '')}
            <span>{startCase(resource.name)}</span>
          </div>
        ),
        value: resource.name,
      })),
    [filterResources]
  );

  const handleTriggerChange = (value: string) => {
    form.resetFields(['input']);
    setSelectedResource([value]);
    form.setFieldValue('resources', [value]);
  };

  return (
    <Card className="trigger-item-container">
      <Row gutter={[8, 8]}>
        <Col span={24}>
          <Typography.Text>{heading}</Typography.Text>
        </Col>
        <Col span={24}>
          <Typography.Text className="text-xs text-grey-muted">
            {subHeading}
          </Typography.Text>
        </Col>
        <Col span={24}>
          <Form.Item
            required
            messageVariables={{
              fieldName: t('label.data-asset-plural'),
            }}
            name={['resources']}
            rules={[
              {
                required: true,
                message: t('label.please-select-entity', {
                  entity: t('label.data-asset'),
                }),
              },
            ]}>
            {isEditMode || fqn ? (
              <Select
                className="w-full"
                data-testid="triggerConfig-type"
                options={resourcesOptions}
                placeholder={t('label.select-field', {
                  field: t('label.data-asset-plural'),
                })}
                value={selectedResource[0]}
                onChange={handleTriggerChange}
              />
            ) : (
              <Button type="primary" onClick={handleAddTriggerClick}>
                {buttonLabel}
              </Button>
            )}
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}

export default ObservabilityFormTriggerItem;
