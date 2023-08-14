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

import { PlusOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Transi18next } from 'utils/CommonUtils';
import { ReactComponent as AddPlaceHolderIcon } from '../../../assets/svg/add-placeholder.svg';
import PermissionErrorPlaceholder from './PermissionErrorPlaceholder';
import { CreatePlaceholderProps } from './placeholder.interface';

const CreateErrorPlaceHolder = ({
  size,
  className,
  permission,
  onClick,
  heading,
  doc,
  buttonId,
}: CreatePlaceholderProps) => {
  const { t } = useTranslation();

  if (!permission) {
    return <PermissionErrorPlaceholder className={className} size={size} />;
  }

  return (
    <div
      className={classNames(className, 'bg-white h-full flex-center')}
      data-testid={`create-error-placeholder-${heading}`}>
      <Space align="center" className="w-full" direction="vertical" size={10}>
        <AddPlaceHolderIcon
          data-testid="no-data-image"
          height={size}
          width={size}
        />
        <div className="text-center text-sm font-normal">
          <Typography.Paragraph style={{ marginBottom: '0' }}>
            {t('message.adding-new-entity-is-easy-just-give-it-a-spin', {
              entity: heading,
            })}
          </Typography.Paragraph>
          <Typography.Paragraph>
            <Transi18next
              i18nKey="message.refer-to-our-doc"
              renderElement={
                <a
                  href={doc}
                  rel="noreferrer"
                  style={{ color: '#1890ff' }}
                  target="_blank"
                />
              }
              values={{
                doc: t('label.doc-plural-lowercase'),
              }}
            />
          </Typography.Paragraph>

          <Tooltip
            placement="top"
            title={!permission && t('message.admin-only-action')}>
            <Button
              ghost
              className="p-x-lg"
              data-testid={buttonId ?? 'add-placeholder-button'}
              icon={<PlusOutlined />}
              type="primary"
              onClick={onClick}>
              {t('label.add')}
            </Button>
          </Tooltip>
        </div>
      </Space>
    </div>
  );
};

export default CreateErrorPlaceHolder;
