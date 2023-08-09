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
import Form, { FormProps, IChangeEvent } from '@rjsf/core';
import { RegistryFieldsType } from '@rjsf/utils';
import { Button, Space } from 'antd';
import classNames from 'classnames';
import BooleanFieldTemplate from 'components/JSONSchemaTemplate/BooleanFieldTemplate';
import DescriptionFieldTemplate from 'components/JSONSchemaTemplate/DescriptionFieldTemplate';
import { FieldErrorTemplate } from 'components/JSONSchemaTemplate/FieldErrorTemplate/FieldErrorTemplate';
import IngestionArrayFieldTemplate from 'components/JSONSchemaTemplate/IngestionArrayFieldTemplate';
import { ObjectFieldTemplate } from 'components/JSONSchemaTemplate/ObjectFieldTemplate';
import WorkflowArrayFieldTemplate from 'components/JSONSchemaTemplate/WorkflowArrayFieldTemplate';
import { INGESTION_WORKFLOW_UI_SCHEMA } from 'constants/Services.constant';
import { ServiceCategory } from 'enums/service.enum';
import { PipelineType } from 'generated/entity/services/ingestionPipelines/ingestionPipeline';
import { IngestionWorkflowData } from 'interface/service.interface';
import React, { FC, useMemo, useState } from 'react';
import { customValidate } from 'utils/formUtils';
import { getSchemaByWorkflowType } from 'utils/IngestionWorkflowUtils';

interface IngestionWorkflowFormProps extends FormProps {
  pipeLineType: PipelineType;
  workflowName: string;
  okText: string;
  cancelText: string;
  serviceCategory: ServiceCategory;
  onCancel: () => void;
}

const IngestionWorkflowForm: FC<IngestionWorkflowFormProps> = ({
  pipeLineType,
  validator,
  className,
  workflowName,
  onCancel,
  okText,
  cancelText,
  onFocus,
  serviceCategory,
}) => {
  const [internalData, setInternalData] = useState<IngestionWorkflowData>({
    name: workflowName,
  });

  const schema = useMemo(
    () => getSchemaByWorkflowType(pipeLineType, serviceCategory),

    [pipeLineType, serviceCategory]
  );

  const handleOnChange = (e: IChangeEvent<IngestionWorkflowData>) => {
    if (e.formData) {
      setInternalData(e.formData);
    }
  };

  return (
    <Form
      focusOnFirstError
      noHtml5Validate
      omitExtraData
      className={classNames('rjsf no-header', className)}
      customValidate={customValidate}
      fields={
        {
          BooleanField: BooleanFieldTemplate,
          ArrayField: WorkflowArrayFieldTemplate,
        } as RegistryFieldsType
      }
      formContext={{ handleFocus: onFocus }}
      formData={internalData}
      idSeparator="/"
      schema={schema}
      showErrorList={false}
      templates={{
        ArrayFieldTemplate: IngestionArrayFieldTemplate,
        DescriptionFieldTemplate: DescriptionFieldTemplate,
        FieldErrorTemplate: FieldErrorTemplate,
        ObjectFieldTemplate: ObjectFieldTemplate,
      }}
      uiSchema={INGESTION_WORKFLOW_UI_SCHEMA}
      validator={validator}
      onChange={handleOnChange}
      onFocus={onFocus}>
      <Space className="w-full justify-end">
        <Space>
          <Button type="link" onClick={onCancel}>
            {cancelText}
          </Button>

          <Button data-testid="submit-btn" htmlType="submit" type="primary">
            {okText}
          </Button>
        </Space>
      </Space>
    </Form>
  );
};

export default IngestionWorkflowForm;
