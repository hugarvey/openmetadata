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

import { DefaultOptionType } from 'antd/lib/select';
import AsyncSelectList from 'components/AsyncSelectList/AsyncSelectList';
import { TagSource } from 'generated/entity/data/container';
import { t } from 'i18next';
import { isArray, isEmpty } from 'lodash';
import { EntityTags } from 'Models';
import React from 'react';
import { fetchTagsElasticSearch } from 'utils/TagsUtils';
import { TagLabel } from '../../../generated/type/tagLabel';

export interface TagSuggestionProps {
  onChange?: (newTags: TagLabel[]) => void;
  value?: TagLabel[];
}

const TagSuggestion: React.FC<TagSuggestionProps> = ({ onChange, value }) => {
  const handleTagSelection = (
    newValue: DefaultOptionType | DefaultOptionType[]
  ) => {
    if (isArray(newValue)) {
      let newTags: EntityTags[] = [];
      if (!isEmpty(newValue)) {
        newTags = newValue.reduce((acc, tag) => {
          const oldTag = value?.find((oldTag) => oldTag.tagFQN === tag.value);
          if (oldTag) {
            return [...acc, oldTag];
          }
          let tagData: EntityTags = {
            tagFQN: tag.value,
            source: TagSource.Classification,
          };

          if (tag.data) {
            tagData = {
              ...tagData,
              name: tag.data?.name,
              displayName: tag.data?.displayName,
              description: tag.data?.description,
              style: tag.data?.style,
            };
          }

          return [...acc, tagData];
        }, [] as EntityTags[]);
      }

      onChange?.(newTags);
    }
  };

  return (
    <AsyncSelectList
      defaultValue={value?.map((item) => item.tagFQN) || []}
      fetchOptions={fetchTagsElasticSearch}
      mode="multiple"
      placeholder={t('label.select-field', {
        field: t('label.tag-plural'),
      })}
      onChange={(value) => handleTagSelection(value)}
    />
  );
};

export default TagSuggestion;
