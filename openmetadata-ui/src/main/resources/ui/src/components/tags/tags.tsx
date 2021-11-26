/*
  * Licensed to the Apache Software Foundation (ASF) under one or more
  * contributor license agreements. See the NOTICE file distributed with
  * this work for additional information regarding copyright ownership.
  * The ASF licenses this file to You under the Apache License, Version 2.0
  * (the "License"); you may not use this file except in compliance with
  * the License. You may obtain a copy of the License at

  * http://www.apache.org/licenses/LICENSE-2.0

  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
*/

import classNames from 'classnames';
import { isString } from 'lodash';
import React, { FunctionComponent } from 'react';
import PopOver from '../common/popover/PopOver';
import { TagProps } from './tags.interface';
import { tagStyles } from './tags.styles';

const Tags: FunctionComponent<TagProps> = ({
  className,
  editable,
  tag,
  startWith,
  type = 'contained',
  removeTag,
  isRemovable = true,
}: TagProps) => {
  const baseStyle = tagStyles.base;
  const layoutStyles = tagStyles[type];
  const textBaseStyle = tagStyles.text.base;
  const textLayoutStyles = editable
    ? tagStyles.text.editable
    : tagStyles.text.default;

  const getTagString = (tag: string) => {
    return tag.startsWith('#') ? tag.slice(1) : tag;
  };

  const getTag = (tag: string, startWith = '') => {
    return (
      <span
        className={classNames(baseStyle, layoutStyles, className)}
        data-testid="tags">
        <span className={classNames(textBaseStyle, textLayoutStyles)}>
          {`${startWith}${tag}`}
        </span>
        {editable && isRemovable && (
          <span
            className="tw-py-1 tw-px-2 tw-rounded tw-cursor-pointer"
            data-testid="remove"
            onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
              e.preventDefault();
              e.stopPropagation();
              removeTag && removeTag(e, getTagString(tag));
            }}>
            <i aria-hidden="true" className="fa fa-times tw-text-grey-300" />
          </span>
        )}
      </span>
    );
  };

  return (
    <>
      {isString(tag) ? (
        getTag(tag, startWith)
      ) : (
        <>
          {tag.description || tag.labelType ? (
            <PopOver
              html={
                <div className="tw-text-left">
                  <p>{tag.description}</p>
                  <p>Type: {tag.labelType}</p>
                </div>
              }
              position="top"
              size="small"
              title=""
              trigger="mouseenter">
              {getTag(tag.tagFQN, startWith)}
            </PopOver>
          ) : (
            getTag(tag.tagFQN, startWith)
          )}
        </>
      )}
    </>
  );
};

export default Tags;
