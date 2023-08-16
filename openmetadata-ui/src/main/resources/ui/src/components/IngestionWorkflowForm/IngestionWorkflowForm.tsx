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
import Form, { IChangeEvent } from '@rjsf/core';
import { RegistryFieldsType } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { Button, Space } from 'antd';
import classNames from 'classnames';
import BooleanFieldTemplate from 'components/JSONSchemaTemplate/BooleanFieldTemplate';
import DescriptionFieldTemplate from 'components/JSONSchemaTemplate/DescriptionFieldTemplate';
import { FieldErrorTemplate } from 'components/JSONSchemaTemplate/FieldErrorTemplate/FieldErrorTemplate';
import { ObjectFieldTemplate } from 'components/JSONSchemaTemplate/ObjectFieldTemplate';
import WorkflowArrayFieldTemplate from 'components/JSONSchemaTemplate/WorkflowArrayFieldTemplate';
import {
  INGESTION_ELASTIC_SEARCH_WORKFLOW_UI_SCHEMA,
  INGESTION_WORKFLOW_NAME_UI_SCHEMA,
  INGESTION_WORKFLOW_UI_SCHEMA,
} from 'constants/Services.constant';
import { FormSubmitType } from 'enums/form.enum';
import { PipelineType } from 'generated/api/services/ingestionPipelines/createIngestionPipeline';
import {
  IngestionWorkflowData,
  IngestionWorkflowFormProps,
} from 'interface/service.interface';
import React, { FC, useMemo, useState } from 'react';
import { transformErrors } from 'utils/formUtils';
import { getSchemaByWorkflowType } from 'utils/IngestionWorkflowUtils';

const IngestionWorkflowForm: FC<IngestionWorkflowFormProps> = ({
  pipeLineType,
  className,
  workflowName,
  enableDebugLog,
  okText,
  cancelText,
  serviceCategory,
  workflowData,
  operationType,
  onCancel,
  onFocus,
  onSubmit,
}) => {
  const [internalData, setInternalData] = useState<IngestionWorkflowData>({
    ...workflowData,
    name: workflowName,
    enableDebugLog,
  });

  const schema = useMemo(
    () => getSchemaByWorkflowType(pipeLineType, serviceCategory),

    [pipeLineType, serviceCategory]
  );

  const uiSchema = useMemo(() => {
    let commonSchema = { ...INGESTION_WORKFLOW_UI_SCHEMA };
    if (pipeLineType === PipelineType.ElasticSearchReindex) {
      commonSchema = {
        ...commonSchema,
        ...INGESTION_ELASTIC_SEARCH_WORKFLOW_UI_SCHEMA,
      };
    }

    if (operationType === FormSubmitType.EDIT) {
      commonSchema = { ...commonSchema, ...INGESTION_WORKFLOW_NAME_UI_SCHEMA };
    }

    return commonSchema;
  }, [pipeLineType, operationType]);

  const handleOnChange = (e: IChangeEvent<IngestionWorkflowData>) => {
    if (e.formData) {
      setInternalData(e.formData);
    }
  };

  const customFields: RegistryFieldsType = {
    BooleanField: BooleanFieldTemplate,
    ArrayField: WorkflowArrayFieldTemplate,
  };

  const handleSubmit = (e: IChangeEvent<IngestionWorkflowData>) => {
    e.formData && onSubmit(e.formData);
  };

  return (
    <Form
      focusOnFirstError
      noHtml5Validate
      omitExtraData
      className={classNames('rjsf no-header', className)}
      fields={customFields}
      formContext={{ handleFocus: onFocus }}
      formData={internalData}
      idSeparator="/"
      schema={schema}
      showErrorList={false}
      templates={{
        DescriptionFieldTemplate: DescriptionFieldTemplate,
        FieldErrorTemplate: FieldErrorTemplate,
        ObjectFieldTemplate: ObjectFieldTemplate,
      }}
      transformErrors={transformErrors}
      uiSchema={uiSchema}
      validator={validator}
      onChange={handleOnChange}
      onFocus={onFocus}
      onSubmit={handleSubmit}>
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
