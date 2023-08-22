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
import { Col, Progress, Row, Typography } from 'antd';
import { TOTAL_ENTITY_CHART_COLOR } from 'constants/DataInsight.constants';
import { round } from 'lodash';
import React, { ReactNode } from 'react';

type EntitySummaryProgressBarProps = {
  pluralize?: boolean;
  progress: number;
  entity: string;
  latestData: Record<string, number>;
  label?: ReactNode;
};

const EntitySummaryProgressBar = ({
  pluralize = true,
  entity,
  latestData,
  progress,
  label,
}: EntitySummaryProgressBarProps) => {
  const pluralizeName = (entity: string) => {
    return entity + 's';
  };

  return (
    <Row className="m-b-xs">
      <Col
        className="d-flex justify-between items-center text-xs"
        md={12}
        sm={24}>
        <Typography.Paragraph className="m-b-0">
          {pluralize ? pluralizeName(entity) : entity}
        </Typography.Paragraph>

        <Typography.Paragraph className="m-b-0">
          {label ?? round(latestData[entity] || 0, 2)}
        </Typography.Paragraph>
      </Col>
      <Col md={12} sm={24}>
        <Progress
          className="p-l-xss"
          percent={progress}
          showInfo={false}
          size="small"
          strokeColor={TOTAL_ENTITY_CHART_COLOR[entity]}
        />
      </Col>
    </Row>
  );
};

export default EntitySummaryProgressBar;
