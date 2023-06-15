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
import { Col, Row } from 'antd';
import { SummaryCard } from 'components/common/SummaryCard/SummaryCard.component';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {} from 'utils/CommonUtils';

export const SummaryPanel = () => {
  const { t } = useTranslation();
  const total = 2000;

  return (
    <Row gutter={16}>
      <Col span={6}>
        <SummaryCard
          className="h-full"
          showProgressBar={false}
          title={t('label.total-entity', { entity: t('label.test') })}
          total={total}
          value={2000}
        />
      </Col>
      <Col span={6}>
        <SummaryCard
          title={t('label.success')}
          total={total}
          type="success"
          value={1000}
        />
      </Col>
      <Col span={6}>
        <SummaryCard
          title={t('label.aborted')}
          total={total}
          type="aborted"
          value={500}
        />
      </Col>
      <Col span={6}>
        <SummaryCard
          title={t('label.failed')}
          total={total}
          type="failed"
          value={500}
        />
      </Col>
    </Row>
  );
};
