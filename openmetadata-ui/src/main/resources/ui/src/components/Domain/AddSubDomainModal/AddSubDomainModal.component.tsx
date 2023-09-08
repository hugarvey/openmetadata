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
import { Button, Modal } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { CreateDataProduct } from 'generated/api/domains/createDataProduct';
import { CreateDomain } from 'generated/api/domains/createDomain';
import React from 'react';
import { useTranslation } from 'react-i18next';
import AddDomainForm from '../AddDomainForm/AddDomainForm.component';
import { DomainFormType } from '../DomainPage.interface';
import { AddSubDomainModalProps } from './AddSubDomainModal.interface';

const AddSubDomainModal = ({
  open,
  onSubmit,
  onCancel,
}: AddSubDomainModalProps) => {
  const { t } = useTranslation();
  const [form] = useForm();

  const handleFormSubmit = async (
    formData: CreateDomain | CreateDataProduct
  ) => {
    onSubmit(formData as CreateDomain);
  };

  return (
    <Modal
      cancelText={t('label.cancel')}
      closable={false}
      footer={[
        <Button key="cancel-btn" type="link" onClick={onCancel}>
          {t('label.cancel')}
        </Button>,
        <Button
          data-testid="save-sub-domain"
          key="save-btn"
          type="primary"
          onClick={() => form.submit()}>
          {t('label.save')}
        </Button>,
      ]}
      maskClosable={false}
      okText={t('label.submit')}
      open={open}
      title={t('label.add-entity', { entity: t('label.sub-domain') })}
      width={750}
      onCancel={onCancel}>
      <AddDomainForm
        isFormInDialog
        formRef={form}
        loading={false}
        type={DomainFormType.SUBDOMAIN}
        onCancel={onCancel}
        onSubmit={handleFormSubmit}
      />
    </Modal>
  );
};

export default AddSubDomainModal;
