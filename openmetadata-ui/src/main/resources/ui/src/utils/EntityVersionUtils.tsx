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

import classNames from 'classnames';
import { FQN_SEPARATOR_CHAR } from 'constants/char.constants';
import {
  ArrayChange,
  Change,
  diffArrays,
  diffWords,
  diffWordsWithSpace,
} from 'diff';
import { OwnerType } from 'enums/user.enum';
import { Field, Topic } from 'generated/entity/data/topic';
import { EntityReference } from 'generated/entity/type';
import { t } from 'i18next';
import { EntityDiffProps } from 'interface/EntityVersion.interface';
import {
  cloneDeep,
  isEmpty,
  isEqual,
  isUndefined,
  toString,
  uniqueId,
} from 'lodash';
import { ExtraInfo } from 'Models';
import { VersionData } from 'pages/EntityVersionPage/EntityVersionPage.component';
import React, { Fragment } from 'react';
import ReactDOMServer from 'react-dom/server';
import { EntityField } from '../constants/Feeds.constants';
import { Column as ContainerColumn } from '../generated/entity/data/container';
import { Column as TableColumn } from '../generated/entity/data/table';
import {
  ChangeDescription,
  FieldChange,
} from '../generated/entity/services/databaseService';
import { TagLabel } from '../generated/type/tagLabel';
import { getEntityName } from './EntityUtils';
import { TagLabelWithStatus } from './EntityVersionUtils.interface';
import { isValidJSONString } from './StringsUtils';

export const getChangedEntityName = (diffObject?: EntityDiffProps) =>
  diffObject?.added?.name ??
  diffObject?.deleted?.name ??
  diffObject?.updated?.name;

export const getChangedEntityOldValue = (diffObject?: EntityDiffProps) =>
  diffObject?.added?.oldValue ??
  diffObject?.deleted?.oldValue ??
  diffObject?.updated?.oldValue;

export const getChangedEntityNewValue = (diffObject?: EntityDiffProps) =>
  diffObject?.added?.newValue ??
  diffObject?.deleted?.newValue ??
  diffObject?.updated?.newValue;

export const getChangeColumnNameFromDiffValue = (name?: string) => {
  return name?.split(FQN_SEPARATOR_CHAR)?.slice(-2, -1)[0];
};

export const getChangeSchemaFieldsName = (name: string) => {
  const formattedName = name.replaceAll(/"/g, '');

  return getChangeColumnNameFromDiffValue(formattedName);
};

export const isEndsWithField = (checkWith: string, name?: string) => {
  return name?.endsWith(checkWith);
};

export const getDiffByFieldName = (
  name: string,
  changeDescription: ChangeDescription,
  exactMatch?: boolean
): {
  added: FieldChange | undefined;
  deleted: FieldChange | undefined;
  updated: FieldChange | undefined;
} => {
  const fieldsAdded = changeDescription?.fieldsAdded || [];
  const fieldsDeleted = changeDescription?.fieldsDeleted || [];
  const fieldsUpdated = changeDescription?.fieldsUpdated || [];
  if (exactMatch) {
    return {
      added: fieldsAdded.find((ch) => ch.name === name),
      deleted: fieldsDeleted.find((ch) => ch.name === name),
      updated: fieldsUpdated.find((ch) => ch.name === name),
    };
  } else {
    return {
      added: fieldsAdded.find((ch) => ch.name?.includes(name)),
      deleted: fieldsDeleted.find((ch) => ch.name?.includes(name)),
      updated: fieldsUpdated.find((ch) => ch.name?.includes(name)),
    };
  }
};

export const getDiffValue = (oldValue: string, newValue: string) => {
  const diff = diffWordsWithSpace(oldValue, newValue);

  return diff.map((part: Change) => {
    return (
      <span
        className={classNames(
          { 'diff-added': part.added },
          { 'diff-removed': part.removed }
        )}
        key={part.value}>
        {part.value}
      </span>
    );
  });
};

export const getDescriptionDiff = (
  oldDescription: string,
  newDescription: string,
  latestDescription?: string
) => {
  if (isEmpty(oldDescription) && isEmpty(newDescription)) {
    return latestDescription || '';
  }

  const diffArr = diffWords(toString(oldDescription), toString(newDescription));

  const result = diffArr.map((diff) => {
    if (diff.added) {
      return ReactDOMServer.renderToString(
        <ins className="diff-added" data-testid="diff-added" key={uniqueId()}>
          {diff.value}
        </ins>
      );
    }
    if (diff.removed) {
      return ReactDOMServer.renderToString(
        <del
          data-testid="diff-removed"
          key={uniqueId()}
          style={{ color: 'grey', textDecoration: 'line-through' }}>
          {diff.value}
        </del>
      );
    }

    return ReactDOMServer.renderToString(
      <span data-testid="diff-normal" key={uniqueId()}>
        {diff.value}
      </span>
    );
  });

  return result.join('');
};

export const getEntityVersionDescription = (
  currentVersionData: VersionData,
  changeDescription: ChangeDescription
) => {
  const descriptionDiff = getDiffByFieldName(
    EntityField.DESCRIPTION,
    changeDescription,
    true
  );
  const oldDescription = getChangedEntityOldValue(descriptionDiff);
  const newDescription = getChangedEntityNewValue(descriptionDiff);

  return getDescriptionDiff(
    oldDescription ?? '',
    newDescription,
    currentVersionData.description
  );
};

export const getTagsDiff = (
  oldTagList: Array<TagLabel>,
  newTagList: Array<TagLabel>
) => {
  const tagDiff = diffArrays<TagLabel, TagLabel>(oldTagList, newTagList);
  const result = tagDiff
    .map((part: ArrayChange<TagLabel>) =>
      (part.value as Array<TagLabel>).map((tag) => ({
        ...tag,
        added: part.added,
        removed: part.removed,
      }))
    )
    ?.flat(Infinity) as Array<TagLabelWithStatus>;

  return result;
};

export const getEntityVersionTags = (
  currentVersionData: VersionData,
  changeDescription: ChangeDescription
) => {
  const tagsDiff = getDiffByFieldName('tags', changeDescription, true);
  const oldTags: Array<TagLabel> = JSON.parse(
    getChangedEntityOldValue(tagsDiff) ?? '[]'
  );
  const newTags: Array<TagLabel> = JSON.parse(
    getChangedEntityNewValue(tagsDiff) ?? '[]'
  );
  const flag: { [x: string]: boolean } = {};
  const uniqueTags: Array<TagLabelWithStatus> = [];

  [
    ...(getTagsDiff(oldTags, newTags) ?? []),
    ...(currentVersionData.tags ?? []),
  ].forEach((elem) => {
    if (!flag[elem.tagFQN as string]) {
      flag[elem.tagFQN as string] = true;
      uniqueTags.push(elem as TagLabelWithStatus);
    }
  });

  return [
    ...uniqueTags.map((t) =>
      t.tagFQN.startsWith('Tier')
        ? { ...t, tagFQN: t.tagFQN.split(FQN_SEPARATOR_CHAR)[1] }
        : t
    ),
  ];
};

export const summaryFormatter = (fieldChange: FieldChange) => {
  const newValueJSON = isValidJSONString(fieldChange?.newValue)
    ? JSON.parse(fieldChange?.newValue)
    : undefined;
  const oldValueJSON = isValidJSONString(fieldChange?.oldValue)
    ? JSON.parse(fieldChange?.oldValue)
    : {};

  const value = newValueJSON ?? oldValueJSON;

  if (fieldChange.name === EntityField.COLUMNS) {
    return `${t('label.column-lowercase-plural')} ${value
      ?.map((val: TableColumn) => val?.name)
      .join(', ')}`;
  } else if (
    fieldChange.name === 'tags' ||
    fieldChange.name?.endsWith('tags')
  ) {
    return `${t('label.tag-lowercase-plural')} ${value
      ?.map((val: TagLabel) => val?.tagFQN)
      ?.join(', ')}`;
  } else if (fieldChange.name === 'owner') {
    return `${fieldChange.name} ${value.name}`;
  } else {
    return fieldChange.name;
  }
};

const getSummaryText = (
  isPrefix: boolean,
  fieldsChanged: FieldChange[],
  actionType: string,
  actionText: string
) => {
  const prefix = isPrefix ? `+ ${actionType}` : '';

  return `${prefix} ${fieldsChanged.map(summaryFormatter).join(', ')} ${
    !isPrefix
      ? t('label.has-been-action-type-lowercase', {
          actionType: actionText,
        })
      : ''
  } `;
};

export const getSummary = (
  changeDescription: ChangeDescription,
  isPrefix = false
) => {
  const fieldsAdded = [...(changeDescription?.fieldsAdded || [])];
  const fieldsDeleted = [...(changeDescription?.fieldsDeleted || [])];
  const fieldsUpdated = [
    ...(changeDescription?.fieldsUpdated?.filter(
      (field) => field.name !== 'deleted'
    ) || []),
  ];
  const isDeleteUpdated = [
    ...(changeDescription?.fieldsUpdated?.filter(
      (field) => field.name === 'deleted'
    ) || []),
  ];

  return (
    <Fragment>
      {isDeleteUpdated?.length > 0 ? (
        <p className="tw-mb-2">
          {isDeleteUpdated
            .map((field) => {
              return field.newValue
                ? t('message.data-asset-has-been-action-type', {
                    actionType: t('label.deleted-lowercase'),
                  })
                : t('message.data-asset-has-been-action-type', {
                    actionType: t('label.restored-lowercase'),
                  });
            })
            .join(', ')}
        </p>
      ) : null}
      {fieldsAdded?.length > 0 ? (
        <p className="tw-mb-2">
          {getSummaryText(
            isPrefix,
            fieldsAdded,
            t('label.added'),
            t('label.added-lowercase')
          )}
        </p>
      ) : null}
      {fieldsUpdated?.length ? (
        <p className="tw-mb-2">
          {getSummaryText(
            isPrefix,
            fieldsUpdated,
            t('label.edited'),
            t('label.updated-lowercase')
          )}
        </p>
      ) : null}
      {fieldsDeleted?.length ? (
        <p className="tw-mb-2">
          {getSummaryText(
            isPrefix,
            fieldsDeleted,
            t('label.removed'),
            t('label.deleted-lowercase')
          )}
        </p>
      ) : null}
    </Fragment>
  );
};

export const isMajorVersion = (version1: string, version2: string) => {
  const v1 = parseFloat(version1);
  const v2 = parseFloat(version2);
  const flag = !isNaN(v1) && !isNaN(v2);
  if (flag) {
    return v1 + 1 === v2;
  }

  return flag;
};

// remove tags from a list if same present in b list
export const removeDuplicateTags = (a: TagLabel[], b: TagLabel[]): TagLabel[] =>
  a.filter(
    (item) => !b.map((secondItem) => secondItem.tagFQN).includes(item.tagFQN)
  );

export const getUpdatedMessageSchema = (
  currentVersionData: VersionData,
  changeDescription: ChangeDescription
): Topic['messageSchema'] => {
  const clonedMessageSchema = cloneDeep(
    (currentVersionData as Topic).messageSchema
  );
  const schemaFields = clonedMessageSchema?.schemaFields;
  const schemaFieldsDiff = getDiffByFieldName(
    EntityField.SCHEMA_FIELDS,
    changeDescription
  );
  const changedSchemaFieldName = getChangeSchemaFieldsName(
    getChangedEntityName(schemaFieldsDiff) ?? ''
  );

  if (
    isEndsWithField(
      EntityField.DESCRIPTION,
      getChangedEntityName(schemaFieldsDiff)
    )
  ) {
    const oldDescription = getChangedEntityOldValue(schemaFieldsDiff);
    const newDescription = getChangedEntityNewValue(schemaFieldsDiff);

    const formatSchemaFieldsData = (messageSchemaFields: Array<Field>) => {
      messageSchemaFields?.forEach((i) => {
        if (isEqual(i.name, changedSchemaFieldName)) {
          i.description = getDescriptionDiff(
            oldDescription ?? '',
            newDescription ?? '',
            i.description
          );
        } else {
          formatSchemaFieldsData(i?.children as Array<Field>);
        }
      });
    };

    formatSchemaFieldsData(schemaFields ?? []);

    return { ...clonedMessageSchema, schemaFields };
  } else if (
    isEndsWithField(EntityField.TAGS, getChangedEntityName(schemaFieldsDiff))
  ) {
    const oldTags: Array<TagLabel> = JSON.parse(
      getChangedEntityOldValue(schemaFieldsDiff) ?? '[]'
    );
    const newTags: Array<TagLabel> = JSON.parse(
      getChangedEntityNewValue(schemaFieldsDiff) ?? '[]'
    );

    const formatSchemaFieldsData = (messageSchemaFields: Array<Field>) => {
      messageSchemaFields?.forEach((i) => {
        if (isEqual(i.name, changedSchemaFieldName)) {
          const flag: { [x: string]: boolean } = {};
          const uniqueTags: Array<TagLabelWithStatus> = [];
          const tagsDiff = getTagsDiff(oldTags, newTags);
          [...tagsDiff, ...(i.tags as Array<TagLabelWithStatus>)].forEach(
            (elem: TagLabelWithStatus) => {
              if (!flag[elem.tagFQN as string]) {
                flag[elem.tagFQN as string] = true;
                uniqueTags.push(elem);
              }
            }
          );
          i.tags = uniqueTags;
        } else {
          formatSchemaFieldsData(i?.children as Array<Field>);
        }
      });
    };

    formatSchemaFieldsData(schemaFields ?? []);

    return { ...clonedMessageSchema, schemaFields };
  } else {
    const schemaFieldsDiff = getDiffByFieldName(
      EntityField.COLUMNS,
      changeDescription,
      true
    );
    let newColumns: Array<Field>;
    if (schemaFieldsDiff.added) {
      const newCol: Array<Field> = JSON.parse(
        schemaFieldsDiff.added?.newValue ?? '[]'
      );
      newCol.forEach((col) => {
        const formatSchemaFieldsData = (arr: Array<Field>) => {
          arr?.forEach((i) => {
            if (isEqual(i.name, col.name)) {
              i.tags = col.tags?.map((tag) => ({ ...tag, added: true }));
              i.description = getDescriptionDiff('', col.description ?? '');
              i.dataTypeDisplay = getDescriptionDiff(
                '',
                col.dataTypeDisplay ?? ''
              );
              i.name = getDescriptionDiff('', col.name);
            } else {
              formatSchemaFieldsData(i?.children as Array<Field>);
            }
          });
        };
        formatSchemaFieldsData(schemaFields ?? []);
      });
    }
    if (schemaFieldsDiff.deleted) {
      const newCol: Array<Field> = JSON.parse(
        schemaFieldsDiff.deleted?.oldValue ?? '[]'
      );
      newColumns = newCol.map((col) => ({
        ...col,
        tags: col.tags?.map((tag) => ({ ...tag, removed: true })),
        description: getDescriptionDiff(col.description ?? '', ''),
        dataTypeDisplay: getDescriptionDiff(col.dataTypeDisplay ?? '', ''),
        name: getDescriptionDiff(col.name, ''),
      }));
    } else {
      return { ...clonedMessageSchema, schemaFields };
    }

    return {
      ...clonedMessageSchema,
      schemaFields: [...newColumns, ...(schemaFields ?? [])],
    };
  }
};

export const getCommonExtraInfoForVersionDetails = (
  changeDescription: ChangeDescription,
  owner?: EntityReference,
  tier?: TagLabel
) => {
  const ownerDiff = getDiffByFieldName('owner', changeDescription);

  const oldOwner = JSON.parse(getChangedEntityOldValue(ownerDiff) ?? '{}');
  const newOwner = JSON.parse(getChangedEntityNewValue(ownerDiff) ?? '{}');
  const ownerPlaceHolder = getEntityName(owner);

  const tagsDiff = getDiffByFieldName('tags', changeDescription, true);
  const newTier = [
    ...JSON.parse(
      tagsDiff?.added?.newValue ??
        tagsDiff?.deleted?.newValue ??
        tagsDiff?.updated?.newValue ??
        '[]'
    ),
  ].find((t) => (t?.tagFQN as string).startsWith('Tier'));

  const oldTier = [
    ...JSON.parse(
      tagsDiff?.added?.oldValue ??
        tagsDiff?.deleted?.oldValue ??
        tagsDiff?.updated?.oldValue ??
        '[]'
    ),
  ].find((t) => (t?.tagFQN as string).startsWith('Tier'));

  const extraInfo: Array<ExtraInfo> = [
    {
      key: 'Owner',
      value:
        !isUndefined(ownerDiff?.added) ||
        !isUndefined(ownerDiff?.deleted) ||
        !isUndefined(ownerDiff?.updated)
          ? getDiffValue(
              oldOwner?.displayName || oldOwner?.name || '',
              newOwner?.displayName || newOwner?.name || ''
            )
          : ownerPlaceHolder
          ? getDiffValue(ownerPlaceHolder, ownerPlaceHolder)
          : '',
      profileName:
        newOwner?.type === OwnerType.USER ? newOwner?.name : undefined,
    },
    {
      key: 'Tier',
      value:
        !isUndefined(newTier) || !isUndefined(oldTier)
          ? getDiffValue(
              oldTier?.tagFQN?.split(FQN_SEPARATOR_CHAR)[1] || '',
              newTier?.tagFQN?.split(FQN_SEPARATOR_CHAR)[1] || ''
            )
          : tier?.tagFQN
          ? tier?.tagFQN.split(FQN_SEPARATOR_CHAR)[1]
          : '',
    },
  ];

  return extraInfo;
};

export function getColumnsDataWithVersionChanges<
  A extends TableColumn | ContainerColumn
>(changeDescription: ChangeDescription, colList?: A[]): Array<A> {
  const columnsDiff = getDiffByFieldName(
    EntityField.COLUMNS,
    changeDescription
  );
  const changedColName = getChangeColumnNameFromDiffValue(
    getChangedEntityName(columnsDiff)
  );

  if (
    isEndsWithField(EntityField.DESCRIPTION, getChangedEntityName(columnsDiff))
  ) {
    const oldDescription = getChangedEntityOldValue(columnsDiff);
    const newDescription = getChangedEntityNewValue(columnsDiff);

    const formatColumnData = (arr: Array<A>) => {
      arr?.forEach((i) => {
        if (isEqual(i.name, changedColName)) {
          i.description = getDescriptionDiff(
            oldDescription ?? '',
            newDescription ?? '',
            i.description
          );
        } else {
          formatColumnData(i?.children as Array<A>);
        }
      });
    };

    formatColumnData(colList ?? []);

    return colList ?? [];
  } else if (
    isEndsWithField(EntityField.TAGS, getChangedEntityName(columnsDiff))
  ) {
    const oldTags: TagLabel[] = JSON.parse(
      getChangedEntityOldValue(columnsDiff) ?? '[]'
    );
    const newTags: TagLabel[] = JSON.parse(
      getChangedEntityNewValue(columnsDiff) ?? '[]'
    );

    const formatColumnData = (arr: Array<A>) => {
      arr?.forEach((i) => {
        if (isEqual(i.name, changedColName)) {
          const flag: { [x: string]: boolean } = {};
          const uniqueTags: TagLabelWithStatus[] = [];
          const tagsDiff = getTagsDiff(oldTags, newTags);

          [...tagsDiff, ...(i.tags as TagLabelWithStatus[])].forEach(
            (elem: TagLabelWithStatus) => {
              if (!flag[elem.tagFQN as string]) {
                flag[elem.tagFQN as string] = true;
                uniqueTags.push(elem);
              }
            }
          );
          i.tags = uniqueTags;
        } else {
          formatColumnData(i?.children as Array<A>);
        }
      });
    };

    formatColumnData(colList ?? []);

    return colList ?? [];
  } else {
    const columnsDiff = getDiffByFieldName(
      EntityField.COLUMNS,
      changeDescription,
      true
    );
    let newColumns: Array<A> = [];
    if (columnsDiff.added) {
      const newCol: Array<A> = JSON.parse(columnsDiff.added?.newValue ?? '[]');
      newCol.forEach((col) => {
        const formatColumnData = (arr: Array<A>) => {
          arr?.forEach((i) => {
            if (isEqual(i.name, col.name)) {
              i.tags = col.tags?.map((tag) => ({ ...tag, added: true }));
              i.description = getDescriptionDiff('', col.description ?? '');
              i.dataTypeDisplay = getDescriptionDiff(
                '',
                col.dataTypeDisplay ?? ''
              );
              i.name = getDescriptionDiff('', col.name);
            } else {
              formatColumnData(i?.children as Array<A>);
            }
          });
        };
        formatColumnData(colList ?? []);
      });
    }
    if (columnsDiff.deleted) {
      const newCol: Array<A> = JSON.parse(
        columnsDiff.deleted?.oldValue ?? '[]'
      );
      newColumns = newCol.map((col) => ({
        ...col,
        tags: col.tags?.map((tag) => ({ ...tag, removed: true })),
        description: getDescriptionDiff(col.description ?? '', ''),
        dataTypeDisplay: getDescriptionDiff(col.dataTypeDisplay ?? '', ''),
        name: getDescriptionDiff(col.name, ''),
      }));
    } else {
      return colList ?? [];
    }

    return [...newColumns, ...(colList ?? [])];
  }
}
