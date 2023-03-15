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

import { Form, Input, Modal, Select, TreeSelect } from 'antd';
import { SearchIndexMappingLanguage } from 'generated/configuration/elasticSearchConfiguration';
import { map } from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ELASTIC_SEARCH_INDEX_ENTITIES,
  ELASTIC_SEARCH_INITIAL_VALUES,
  RECREATE_INDEX_OPTIONS,
} from '../../constants/elasticsearch.constant';
import { CreateEventPublisherJob } from '../../generated/api/createEventPublisherJob';

interface ReIndexAllModalInterface {
  visible: boolean;
  onCancel: () => void;
  onSave?: (data: CreateEventPublisherJob) => void;
  confirmLoading: boolean;
}

const ReIndexAllModal = ({
  visible,
  onCancel,
  onSave,
  confirmLoading,
}: ReIndexAllModalInterface) => {
  const { t } = useTranslation();

  const entityOptions = [
    {
      title: 'All',
      value: 'all',
      key: 'all',
      children: [
        ...ELASTIC_SEARCH_INDEX_ENTITIES.map(({ value, label }) => ({
          title: label,
          value: value,
          key: value,
        })),
      ],
    },
  ];

  const langOptions = map(SearchIndexMappingLanguage, (value) => ({
    label: value,
    value,
  }));

  return (
    <Modal
      centered
      closable={false}
      confirmLoading={confirmLoading}
      okButtonProps={{
        form: 're-index-form',
        type: 'primary',
        htmlType: 'submit',
      }}
      okText="Submit"
      open={visible}
      title={t('label.re-index-elasticsearch')}
      width={650}
      onCancel={onCancel}>
      <Form
        id="re-index-form"
        initialValues={ELASTIC_SEARCH_INITIAL_VALUES}
        layout="vertical"
        name="elastic-search-re-index"
        onFinish={onSave}>
        <Form.Item
          label={t('label.recreate-index-plural')}
          name="recreateIndex">
          <Select
            data-testid="re-index-selector"
            options={RECREATE_INDEX_OPTIONS}
          />
        </Form.Item>
        <Form.Item label={t('label.entity-plural')} name="entities">
          <TreeSelect
            treeCheckable
            treeDefaultExpandAll
            treeData={entityOptions}
          />
        </Form.Item>
        <Form.Item
          label={t('label.flush-interval-secs')}
          name="flushIntervalInSec">
          <Input
            data-testid="flush-interval-in-sec"
            placeholder={t('label.enter-entity', {
              entity: t('label.second-plural'),
            })}
          />
        </Form.Item>

        <Form.Item label={`${t('label.batch-size')}:`} name="batchSize">
          <Input
            data-testid="batch-size"
            placeholder={t('label.enter-entity', {
              entity: t('label.batch-size'),
            })}
          />
        </Form.Item>
        <Form.Item
          label={`${t('label.language')}:`}
          name="searchIndexMappingLanguage">
          <Select options={langOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ReIndexAllModal;
