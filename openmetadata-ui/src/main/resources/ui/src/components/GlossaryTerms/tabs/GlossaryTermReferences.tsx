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

import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import { NO_PERMISSION_FOR_ACTION } from 'constants/HelperTextUtil';
import { t } from 'i18next';
import { cloneDeep, isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';
import SVGIcons, { Icons } from 'utils/SvgUtils';
import {
  GlossaryTerm,
  TermReference,
} from '../../../generated/entity/data/glossaryTerm';
import { OperationPermission } from '../../PermissionProvider/PermissionProvider.interface';
import GlossaryTermReferencesModal from '../GlossaryTermReferencesModal.component';

interface GlossaryTermReferences {
  glossaryTerm: GlossaryTerm;
  permissions: OperationPermission;
  onGlossaryTermUpdate: (glossaryTerm: GlossaryTerm) => void;
}

const GlossaryTermReferences = ({
  glossaryTerm,
  permissions,
  onGlossaryTermUpdate,
}: GlossaryTermReferences) => {
  const [references, setReferences] = useState<TermReference[]>([]);
  const [isViewMode, setIsViewMode] = useState<boolean>(true);

  const handleReferencesSave = async (newReferences: TermReference[]) => {
    try {
      const updatedRef = newReferences.filter(
        (ref) => ref.endpoint && ref.name
      );
      if (!isEqual(updatedRef, glossaryTerm.references)) {
        let updatedGlossaryTerm = cloneDeep(glossaryTerm);
        updatedGlossaryTerm = {
          ...updatedGlossaryTerm,
          references: updatedRef,
        };

        onGlossaryTermUpdate(updatedGlossaryTerm);
      }
      setIsViewMode(true);
    } catch (error) {
      // Added catch block to prevent uncaught promise
    }
  };

  const onReferenceModalSave = (values: TermReference[]) => {
    console.log(values);
    handleReferencesSave(values);
  };

  useEffect(() => {
    if (glossaryTerm.references?.length) {
      setReferences(glossaryTerm.references);
    }
  }, [glossaryTerm]);

  return (
    <div data-testid="references-container">
      <Space className="w-full" direction="vertical">
        <Space
          className="w-full justify-between"
          data-testid={`section-${t('label.reference-plural')}`}>
          <div className="flex-center">
            <Typography.Text className="text-grey-muted">
              {t('label.reference-plural')}
            </Typography.Text>
          </div>
          <Tooltip
            title={
              permissions.EditAll ? t('label.edit') : NO_PERMISSION_FOR_ACTION
            }>
            <Button
              className="cursor-pointer m--t-xss"
              data-testid="edit-button"
              disabled={!permissions.EditAll}
              icon={
                <SVGIcons
                  alt="edit"
                  icon={Icons.IC_EDIT_PRIMARY}
                  width="16px"
                />
              }
              size="small"
              type="text"
              onClick={() => setIsViewMode(false)}
            />
          </Tooltip>
        </Space>
        <div className="flex">
          {references.length > 0 ? (
            references.map((ref, i) => (
              <Tag className="term-reference-tag tw-bg-white" key={i}>
                <a
                  className="flex"
                  data-testid="owner-link"
                  href={ref?.endpoint}
                  rel="noopener noreferrer"
                  target="_blank">
                  <Typography.Text
                    className="tw-text-primary "
                    ellipsis={{ tooltip: ref?.name }}
                    style={{ maxWidth: 200 }}>
                    {ref?.name}
                  </Typography.Text>
                </a>
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary">
              {t('message.no-reference-available')}
            </Typography.Text>
          )}
        </div>
      </Space>

      <GlossaryTermReferencesModal
        isVisible={!isViewMode}
        references={glossaryTerm.references || []}
        onClose={() => {
          setIsViewMode(true);
        }}
        onSave={(values: TermReference[]) => {
          onReferenceModalSave(values);
        }}
      />
    </div>
  );
};

export default GlossaryTermReferences;
