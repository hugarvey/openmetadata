import classNames from 'classnames';
import { diffArrays, diffWordsWithSpace } from 'diff';
import { isUndefined } from 'lodash';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import gfm from 'remark-gfm';
import {
  ChangeDescription,
  FieldChange,
} from '../generated/entity/services/databaseService';
import { TagLabel } from '../generated/type/tagLabel';

/*eslint-disable */
const parseMarkdown = (content: string, className: string) => {
  return (
    <ReactMarkdown
      children={content
        .replaceAll(/&lt;/g, '<')
        .replaceAll(/&gt;/g, '>')
        .replaceAll('\\', '')}
      components={{
        h1: 'p',
        h2: 'p',
        h3: 'p',
        h4: 'p',
        h5: 'p',
        h6: 'p',
        p: ({ node, children, ...props }) => {
          return (
            <p className={className} {...props}>
              {children}
            </p>
          );
        },
      }}
      remarkPlugins={[gfm]}
      rehypePlugins={[[rehypeRaw, { allowDangerousHtml: false }]]}
    />
  );
};
/*eslint-disable */

export const getDiffByFieldName = (
  name: string,
  changeDescription: ChangeDescription
): {
  added: FieldChange | undefined;
  deleted: FieldChange | undefined;
  updated: FieldChange | undefined;
} => {
  const fieldsAdded = changeDescription?.fieldsAdded || [];
  const fieldsDeleted = changeDescription?.fieldsDeleted || [];
  const fieldsUpdated = changeDescription?.fieldsUpdated || [];

  const diff = {
    added: fieldsAdded.find((ch) => ch.name?.startsWith(name)),
    deleted: fieldsDeleted.find((ch) => ch.name?.startsWith(name)),
    updated: fieldsUpdated.find((ch) => ch.name?.startsWith(name)),
  };

  return diff;
};

export const getDiffValue = (oldValue: string, newValue: string) => {
  const diff = diffWordsWithSpace(oldValue, newValue);

  // eslint-disable-next-line
  return diff.map((part: any, index: any) => {
    return (
      <span
        className={classNames(
          { 'diff-added': part.added },
          { 'diff-removed': part.removed }
        )}
        key={index}>
        {part.value}
      </span>
    );
  });
};

export const getDescriptionDiff = (
  oldDescription: string | undefined,
  newDescription: string | undefined,
  latestDescription: string | undefined
) => {
  if (!isUndefined(newDescription) || !isUndefined(oldDescription)) {
    const diff = diffWordsWithSpace(oldDescription ?? '', newDescription ?? '');
    // eslint-disable-next-line
    const result: Array<string> = diff.map((part: any, index: any) => {
      const classes = classNames(
        { 'diff-added': part.added },
        { 'diff-removed': part.removed }
      );

      return ReactDOMServer.renderToString(
        <div key={index}>{parseMarkdown(part.value, classes)}</div>
      );
    });

    return result.join('');
  } else {
    return latestDescription || '';
  }
};

export const getTagsDiff = (
  oldTagList: Array<TagLabel>,
  newTagList: Array<TagLabel>
) => {
  const tagDiff = diffArrays(oldTagList, newTagList);
  const result = tagDiff
    // eslint-disable-next-line
    .map((part: any) =>
      (part.value as Array<TagLabel>).map((tag) => ({
        ...tag,
        added: part.added,
        removed: part.removed,
      }))
    )
    ?.flat(Infinity);

  return result;
};
