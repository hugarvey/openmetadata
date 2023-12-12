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

import { Typography } from 'antd';
import { get, isEmpty, isUndefined } from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';
import { SearchedDataProps } from '../../src/components/SearchedData/SearchedData.interface';
import { ReactComponent as IconExternalLink } from '../assets/svg/external-links.svg';
import { BasicEntityInfo } from '../components/Explore/EntitySummaryPanel/SummaryList/SummaryList.interface';
import { NO_DATA_PLACEHOLDER } from '../constants/constants';
import { SummaryEntityType } from '../enums/EntitySummary.enum';
import { Chart } from '../generated/entity/data/chart';
import { TagLabel } from '../generated/entity/data/container';
import { MlFeature } from '../generated/entity/data/mlmodel';
import { Task } from '../generated/entity/data/pipeline';
import { SearchIndexField } from '../generated/entity/data/searchIndex';
import { Column, TableConstraint } from '../generated/entity/data/table';
import { Field } from '../generated/entity/data/topic';
import { getEntityName } from './EntityUtils';
import { stringToHTML } from './StringsUtils';

const { Text } = Typography;

export interface EntityNameProps {
  name?: string;
  displayName?: string;
}

const getTitleName = (data: EntityNameProps) =>
  getEntityName(data) || NO_DATA_PLACEHOLDER;

export const getSortedTags = ({
  sortTagsBasedOnGivenArr,
  tags,
}): TagLabel[] => {
  const ColumnDataTags: {
    tagForSort: TagLabel[];
    remainingTags: TagLabel[];
  } = { tagForSort: [], remainingTags: [] };

  const { tagForSort, remainingTags } = tags?.reduce((acc, tag) => {
    if (sortTagsBasedOnGivenArr?.includes(tag.tagFQN)) {
      acc.tagForSort.push({ ...tag, isHighlighted: true });
    } else {
      acc.remainingTags.push(tag);
    }

    return acc;
  }, ColumnDataTags);

  return [...tagForSort, ...remainingTags];
};

export const getFormattedEntityData = (
  entityType: SummaryEntityType,
  entityInfo?: Array<Column | Field | Chart | Task | MlFeature>,
  tableConstraints?: TableConstraint[],
  highlights?: SearchedDataProps['data'][number]['highlights']
): BasicEntityInfo[] => {
  if (isEmpty(entityInfo)) {
    return [];
  }

  const tagHighlights = get(highlights, 'tag.name');

  switch (entityType) {
    case SummaryEntityType.COLUMN: {
      const columnHighlights = [
        ...get(highlights, 'columns.name', []),
        ...get(highlights, 'columns.childrens.name', []),
      ];

      const columnHighlightsMap =
        columnHighlights?.reduce((acc, colHighlight, index) => {
          acc[colHighlight.replace(/<\/?span(.*?)>/g, '')] = index;

          return acc;
        }, {}) ?? {};

      const { entityWithSortOption, entityWithoutSortOption } = (
        entityInfo as Column[]
      ).reduce(
        (acc, column) => {
          const columnData = {
            name: column.name,
            title: (
              <Text className="entity-title" data-testid="entity-title">
                {getTitleName(column)}
              </Text>
            ),
            type: column.dataType,
            tags: column.tags,
            description: column.description,
            columnConstraint: column.constraint,
            tableConstraints: tableConstraints,
            children: getFormattedEntityData(
              SummaryEntityType.COLUMN,
              column.children
            ),
          };

          const isTagPresentInColumnData = column.tags?.find((tag) =>
            tagHighlights?.includes(tag.tagFQN)
          );

          if (
            isTagPresentInColumnData ||
            !isUndefined(columnHighlightsMap[column.name])
          ) {
            columnData.tags = getSortedTags({
              sortTagsBasedOnGivenArr: tagHighlights,
              tags: columnData.tags,
            });

            if (!isUndefined(columnHighlightsMap[column.name])) {
              columnData.title = (
                <Text className="entity-title" data-testid="entity-title">
                  {stringToHTML(
                    columnHighlights[columnHighlightsMap[column.name]]
                  )}
                </Text>
              );
            }

            acc.entityWithSortOption.push(columnData);
          } else {
            acc.entityWithoutSortOption.push(columnData);
          }

          return acc;
        },
        {
          entityWithSortOption: [] as BasicEntityInfo[],
          entityWithoutSortOption: [] as BasicEntityInfo[],
        }
      );

      return [...entityWithSortOption, ...entityWithoutSortOption];
    }
    case SummaryEntityType.FIELD: {
      return (entityInfo as SearchIndexField[]).map((field) => ({
        name: field.name,
        title: <Text className="entity-title">{getTitleName(field)}</Text>,
        type: field.dataType,
        tags: field.tags,
        description: field.description,
        children: getFormattedEntityData(
          SummaryEntityType.FIELD,
          field.children
        ),
      }));
    }
    case SummaryEntityType.CHART: {
      return (entityInfo as Chart[]).map((chart) => ({
        name: chart.name,
        title: (
          <Link target="_blank" to={{ pathname: chart.sourceUrl }}>
            <div className="d-flex">
              <Text className="entity-title text-link-color font-medium m-r-xss">
                {getTitleName(chart)}
              </Text>
              <IconExternalLink width={12} />
            </div>
          </Link>
        ),
        type: chart.chartType,
        tags: chart.tags,
        description: chart.description,
      }));
    }
    case SummaryEntityType.TASK: {
      return (entityInfo as Task[]).map((task) => ({
        name: task.name,
        title: (
          <Link target="_blank" to={{ pathname: task.sourceUrl }}>
            <div className="d-flex">
              <Text
                className="entity-title text-link-color font-medium m-r-xss"
                ellipsis={{ tooltip: true }}>
                {getTitleName(task)}
              </Text>
              <IconExternalLink width={12} />
            </div>
          </Link>
        ),
        type: task.taskType,
        tags: task.tags,
        description: task.description,
      }));
    }
    case SummaryEntityType.MLFEATURE: {
      return (entityInfo as MlFeature[]).map((feature) => ({
        algorithm: feature.featureAlgorithm,
        name: feature.name || '--',
        title: <Text className="entity-title">{getTitleName(feature)}</Text>,
        type: feature.dataType,
        tags: feature.tags,
        description: feature.description,
      }));
    }
    case SummaryEntityType.SCHEMAFIELD: {
      return (entityInfo as Field[]).map((field) => ({
        name: field.name,
        title: <Text className="entity-title"> {getTitleName(field)}</Text>,
        type: field.dataType,
        description: field.description,
        tags: field.tags,
        children: getFormattedEntityData(
          SummaryEntityType.SCHEMAFIELD,
          field.children
        ),
      }));
    }
    default: {
      return [];
    }
  }
};
