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
import { Form, Space } from 'antd';
import { useForm } from 'antd/es/form/Form';
import Modal from 'antd/lib/modal/Modal';
import { UserTag } from 'components/common/UserTag/UserTag.component';
import { UserTagSize } from 'components/common/UserTag/UserTag.interface';
import { VALIDATION_MESSAGES } from 'constants/constants';
import { ENTITY_NAME_REGEX } from 'constants/regex.constants';
import { compare } from 'fast-json-patch';
import { Persona } from 'generated/entity/teams/persona';
import { EntityReference } from 'generated/entity/type';
import { FieldTypes, FormItemLayout } from 'interface/FormUtils.interface';
import { isEmpty } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPersona, updatePersona } from 'rest/PersonaAPI';
import { getEntityName } from 'utils/EntityUtils';
import { generateFormFields } from 'utils/formUtils';
import { showErrorToast } from 'utils/ToastUtils';

interface AddPersonaFormProps {
  onCancel: () => void;
  onSave: () => void;
  persona?: Persona;
}

export const AddPersonaForm = ({
  onCancel,
  onSave,
  persona,
}: AddPersonaFormProps) => {
  const [form] = useForm();
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  const usersList = Form.useWatch<EntityReference[]>('users', form) ?? [];
  const isEditMode = !isEmpty(persona);

  const handleSave = useCallback(
    async (data: Persona) => {
      try {
        setIsSaving(true);
        const { users } = data;

        const usersList = users?.map((u) => u.id) ?? [];
        if (persona && isEditMode) {
          const jsonPatch = compare(persona, data);

          await updatePersona(persona?.id, jsonPatch);
        } else {
          await createPersona({ ...data, users: usersList });
        }
        onSave();
      } catch (error) {
        showErrorToast(error);
      } finally {
        setIsSaving(false);
      }
    },
    [isEditMode, persona]
  );

  const fields = useMemo(
    () => [
      {
        name: 'name',
        required: true,
        label: t('label.name'),
        id: 'root/name',
        type: FieldTypes.TEXT,
        props: {
          'data-testid': 'name',
          autoComplete: 'off',
        },
        placeholder: t('label.name'),
        rules: [
          {
            pattern: ENTITY_NAME_REGEX,
            message: t('message.custom-property-name-validation'),
          },
        ],
      },
      {
        name: 'description',
        required: true,
        label: t('label.description'),
        id: 'root/description',
        type: FieldTypes.DESCRIPTION,
        props: {
          'data-testid': 'description',
          initialValue: '',
        },
      },
      {
        name: 'users',
        required: true,
        label: t('label.user-plural'),
        id: 'root/users',
        formItemProps: {
          valuePropName: 'selectedUsers',
          trigger: 'onUpdate',
          initialValue: [],
          className: 'm-0',
        },
        formItemLayout: FormItemLayout.HORIZONATAL,
        type: FieldTypes.USER_MULTI_SELECT,
        props: {
          'data-testid': 'user',
          hasPermission: true,
        },
      },
    ],
    []
  );

  return (
    <Modal
      centered
      visible
      cancelText={t('label.cancel')}
      confirmLoading={isSaving}
      okText={t('label.create')}
      title={isEmpty(persona) ? 'Add Persona' : 'Edit Persona'}
      width={750}
      onCancel={onCancel}
      onOk={() => form.submit()}>
      <Form
        form={form}
        initialValues={persona}
        layout="vertical"
        validateMessages={VALIDATION_MESSAGES}
        onFinish={handleSave}>
        {generateFormFields(fields)}

        {Boolean(usersList.length) && (
          <Space
            wrap
            className="m-y-xs"
            data-testid="reviewers-container"
            size={[8, 8]}>
            {usersList.map((d) => (
              <UserTag
                id={d.id}
                key={d.id}
                name={getEntityName(d)}
                size={UserTagSize.small}
              />
            ))}
          </Space>
        )}
      </Form>
    </Modal>
  );
};
