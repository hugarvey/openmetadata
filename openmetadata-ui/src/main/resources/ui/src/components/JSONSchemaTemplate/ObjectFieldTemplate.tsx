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

import { PlusOutlined } from '@ant-design/icons';
import { ObjectFieldTemplateProps } from '@rjsf/core';
import { Space, Typography } from 'antd';
import classNames from 'classnames';
import InfoPopover from 'components/common/InfoPopover/InfoPopover';
import React, { Fragment, FunctionComponent } from 'react';
import { Button } from '../buttons/Button/Button';

export const ObjectFieldTemplate: FunctionComponent<ObjectFieldTemplateProps> =
  (props: ObjectFieldTemplateProps) => {
    return (
      <Fragment>
        <div className="tw-flex tw-justify-between tw-items-center">
          <Space size={0}>
            <label
              className="control-label"
              id={`${props.idSchema.$id}__title`}>
              {props.title}
            </label>
            <p
              className="field-description"
              id={`${props.idSchema.$id}__description`}>
              <InfoPopover
                content={
                  <Typography className="text-grey-muted">
                    {props.description}
                  </Typography>
                }
              />
            </p>
          </Space>
          {props.schema.additionalProperties && (
            <Button
              className="tw-h-7 tw-w-7 tw-px-2"
              data-testid={`add-item-${props.title}`}
              id={`${props.idSchema.$id}__add`}
              size="small"
              theme="primary"
              variant="contained"
              onClick={() => {
                props.onAddClick(props.schema)();
              }}>
              <PlusOutlined />
            </Button>
          )}
        </div>
        {props.properties.map((element, index) => (
          <div
            className={classNames('property-wrapper', {
              'additional-fields': props.schema.additionalProperties,
            })}
            key={`${element.content.key}-${index}`}>
            {element.content}
          </div>
        ))}
      </Fragment>
    );
  };
