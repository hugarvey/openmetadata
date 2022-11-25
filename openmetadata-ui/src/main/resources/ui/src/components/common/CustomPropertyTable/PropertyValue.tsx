/*
 *  Copyright 2021 Collate
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

import { t } from 'i18next';
import { isUndefined, toNumber } from 'lodash';
import React, { FC, Fragment, useState } from 'react';
import { Table } from '../../../generated/entity/data/table';
import { EntityReference } from '../../../generated/type/entityReference';
import SVGIcons, { Icons } from '../../../utils/SvgUtils';
import { ModalWithMarkdownEditor } from '../../Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor';
import RichTextEditorPreviewer from '../rich-text-editor/RichTextEditorPreviewer';
import { PropertyInput } from './PropertyInput';

interface Props {
  propertyName: string;
  propertyType: EntityReference;
  extension: Table['extension'];
  onExtensionUpdate: (updatedExtension: Table['extension']) => Promise<void>;
}

const EditIcon = ({ onShowInput }: { onShowInput: () => void }) => (
  <span
    className="tw-cursor-pointer tw-ml-2"
    data-testid="edit-icon"
    onClick={onShowInput}>
    <SVGIcons alt="edit" icon={Icons.EDIT} width="16px" />
  </span>
);

export const PropertyValue: FC<Props> = ({
  propertyName,
  extension,
  propertyType,
  onExtensionUpdate,
}) => {
  const value = extension?.[propertyName];

  const [showInput, setShowInput] = useState<boolean>(false);

  const onShowInput = () => {
    setShowInput(true);
  };

  const onHideInput = () => {
    setShowInput(false);
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const onInputSave = async (updatedValue: any) => {
    const updatedExtension = {
      ...(extension || {}),
      [propertyName]:
        propertyType.name === 'integer'
          ? toNumber(updatedValue || 0)
          : updatedValue,
    };
    await onExtensionUpdate(updatedExtension);
    setShowInput(false);
  };

  const getPropertyInput = () => {
    switch (propertyType.name) {
      case 'string':
      case 'integer':
        return (
          <PropertyInput
            propertyName={propertyName}
            type={propertyType.name as string}
            value={value}
            onCancel={onHideInput}
            onSave={onInputSave}
          />
        );
      case 'markdown':
        return (
          <ModalWithMarkdownEditor
            visible
            header={t('label.edit-property', {
              propertyName,
            })}
            placeholder={t('label.enter-property-value')}
            value={value || ''}
            onCancel={onHideInput}
            onSave={onInputSave}
          />
        );

      default:
        return null;
    }
  };

  const getPropertyValue = () => {
    switch (propertyType.name) {
      case 'markdown':
        return <RichTextEditorPreviewer markdown={value || ''} />;

      case 'string':
      case 'integer':
      default:
        return <span data-testid="value">{value}</span>;
    }
  };

  const getValueElement = () => {
    const propertyValue = getPropertyValue();
    const isInteger = propertyType.name === 'integer';
    if (isInteger) {
      return !isUndefined(value) ? (
        propertyValue
      ) : (
        <span className="tw-text-grey-muted" data-testid="no-data">
          No data
        </span>
      );
    } else {
      return value ? (
        propertyValue
      ) : (
        <span className="tw-text-grey-muted" data-testid="no-data">
          No data
        </span>
      );
    }
  };

  return (
    <div>
      {showInput ? (
        getPropertyInput()
      ) : (
        <Fragment>
          <div className="tw-flex">
            {getValueElement()}
            <EditIcon onShowInput={onShowInput} />
          </div>
        </Fragment>
      )}
    </div>
  );
};
