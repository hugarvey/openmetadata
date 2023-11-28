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

import { Col, Row, Space, Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_CHAR_LIMIT_ENTITY_SUMMARY } from '../../../../../constants/constants';
import { getTagValue } from '../../../../../utils/CommonUtils';
import { prepareConstraintIcon } from '../../../../../utils/TableUtils';
import RichTextEditorPreviewer from '../../../../common/RichTextEditor/RichTextEditorPreviewer';
import TagsViewer from '../../../../Tag/TagsViewer/TagsViewer';
import { SummaryListItemProps } from './SummaryListItems.interface';

const { Text, Paragraph } = Typography;

function SummaryListItem({
  entityDetails,
  isColumnsData,
}: SummaryListItemProps) {
  const { t } = useTranslation();

  return (
    <Col key={entityDetails.name} span={24}>
      <div className="summary-list-item-container">
        <Row gutter={[0, 8]}>
          <Col
            className="d-flex items-baseline"
            data-testid="title-container"
            span={24}>
            {isColumnsData &&
              prepareConstraintIcon({
                columnName: entityDetails.name,
                columnConstraint: entityDetails.columnConstraint,
                tableConstraints: entityDetails.tableConstraints,
                iconClassName: 'm-r-xss',
                iconWidth: '14px',
              })}
            {entityDetails.title}

            {entityDetails.type && (
              <Typography.Text
                className="text-grey-muted text-xs p-l-xs"
                data-testid="entity-type">{`(${entityDetails.type})`}</Typography.Text>
            )}
          </Col>

          {entityDetails.algorithm && (
            <Col span={24}>
              <Space className="h-6" size={4}>
                <Text className="text-grey-muted">{`${t(
                  'label.algorithm'
                )}:`}</Text>
                <Text
                  className="font-medium text-grey-body"
                  data-testid="algorithm">
                  {entityDetails.algorithm}
                </Text>
              </Space>
            </Col>
          )}

          <Col span={24}>
            <Paragraph className="text-grey-body m-y-0">
              {entityDetails.description ? (
                <RichTextEditorPreviewer
                  markdown={entityDetails.description || ''}
                  maxLength={MAX_CHAR_LIMIT_ENTITY_SUMMARY}
                />
              ) : (
                t('label.no-entity', { entity: t('label.description') })
              )}
            </Paragraph>
          </Col>
          {entityDetails.tags && entityDetails.tags.length !== 0 && (
            <Col className="flex-grow" span={24}>
              <TagsViewer
                sizeCap={2}
                tags={(entityDetails.tags || []).map((tag) => getTagValue(tag))}
              />
            </Col>
          )}
        </Row>
      </div>
    </Col>
  );
}

export default SummaryListItem;
