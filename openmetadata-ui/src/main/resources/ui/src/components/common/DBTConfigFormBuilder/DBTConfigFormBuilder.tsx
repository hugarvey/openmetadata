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

import { Button, Form, FormProps, Space } from 'antd';
import React, {
  Fragment,
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { FieldProp, FieldTypes, generateFormFields } from 'utils/formUtils';
import { FormSubmitType } from '../../../enums/form.enum';
import {
  DBTBucketDetails,
  SCredentials,
} from '../../../generated/metadataIngestion/dbtPipeline';
import { getSeparator } from '../../../utils/CommonUtils';
import { ModifiedDbtConfig } from '../../AddIngestion/addIngestion.interface';
import { DBTCloudConfig } from './DBTCloudConfig';
import { DBTConfigFormProps } from './DBTConfigForm.interface';
import { DBTSources } from './DBTFormConstants';
import { DBT_SOURCES, GCS_CONFIG } from './DBTFormEnum';
import { DBTGCSConfig } from './DBTGCSConfig';
import { DBTHttpConfig } from './DBTHttpConfig';
import { DBTLocalConfig } from './DBTLocalConfig';
import { DBTS3Config } from './DBTS3Config';

const DBTConfigFormBuilder: FunctionComponent<DBTConfigFormProps> = ({
  cancelText,
  data,
  formType,
  okText,
  onCancel,
  onChange,
  onSubmit,
  onFocus,
}: DBTConfigFormProps) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const currentDbtConfigSourceType = Form.useWatch('dbtConfigSource', form);

  const { dbtConfigSource, gcsConfigType, ingestionName, dbtConfigSourceType } =
    useMemo(
      () => ({
        ingestionName: data.ingestionName,
        gcsConfigType: data.gcsConfigType,
        dbtConfigSourceType: data.dbtConfigSourceType,
        dbtConfigSource: {
          ...data.dbtConfigSource,
          dbtClassificationName: data.dbtClassificationName,
          dbtUpdateDescriptions: data.dbtUpdateDescriptions,
          includeTags: data.includeTags,
        },
      }),
      [
        data.ingestionName,
        data.gcsConfigType,
        data.dbtConfigSourceType,
        data.dbtConfigSource,
        data.includeTags,
      ]
    );

  const [dbtConfig, setDbtConfig] =
    useState<ModifiedDbtConfig>(dbtConfigSource);

  const updateDbtConfig = (
    key: keyof ModifiedDbtConfig,
    val?: string | boolean | SCredentials | DBTBucketDetails
  ) => {
    setDbtConfig((pre) => {
      return { ...pre, [key]: val };
    });
  };

  const handleEnableDebugLogCheck = (value: boolean) =>
    onChange({
      enableDebugLog: value,
      dbtConfigSource: dbtConfig,
    });

  const getCloudConfigFields = () => {
    return (
      <DBTCloudConfig
        cancelText={cancelText}
        dbtClassificationName={dbtConfig?.dbtClassificationName}
        dbtCloudAccountId={dbtConfig?.dbtCloudAccountId}
        dbtCloudAuthToken={dbtConfig?.dbtCloudAuthToken}
        dbtCloudJobId={dbtConfig?.dbtCloudJobId}
        dbtCloudProjectId={dbtConfig?.dbtCloudProjectId}
        dbtCloudUrl={dbtConfig.dbtCloudUrl}
        dbtUpdateDescriptions={dbtConfig?.dbtUpdateDescriptions}
        enableDebugLog={data.enableDebugLog}
        handleEnableDebugLogCheck={handleEnableDebugLogCheck}
        includeTags={dbtConfig?.includeTags}
        okText={okText}
        onCancel={onCancel}
        onConfigUpdate={updateDbtConfig}
        onSubmit={onSubmit}
      />
    );
  };

  const getLocalConfigFields = () => {
    return (
      <DBTLocalConfig
        cancelText={cancelText}
        dbtCatalogFilePath={dbtConfig?.dbtCatalogFilePath}
        dbtClassificationName={dbtConfig?.dbtClassificationName}
        dbtManifestFilePath={dbtConfig?.dbtManifestFilePath}
        dbtRunResultsFilePath={dbtConfig?.dbtRunResultsFilePath}
        dbtUpdateDescriptions={dbtConfig?.dbtUpdateDescriptions}
        enableDebugLog={data.enableDebugLog}
        handleEnableDebugLogCheck={handleEnableDebugLogCheck}
        includeTags={dbtConfig?.includeTags}
        okText={okText}
        onCancel={onCancel}
        onConfigUpdate={updateDbtConfig}
        onSubmit={onSubmit}
      />
    );
  };

  const getHttpConfigFields = () => {
    return (
      <DBTHttpConfig
        cancelText={cancelText}
        dbtCatalogHttpPath={dbtConfig?.dbtCatalogHttpPath}
        dbtClassificationName={dbtConfig?.dbtClassificationName}
        dbtManifestHttpPath={dbtConfig?.dbtManifestHttpPath}
        dbtRunResultsHttpPath={dbtConfig?.dbtRunResultsHttpPath}
        dbtUpdateDescriptions={dbtConfig?.dbtUpdateDescriptions}
        enableDebugLog={data.enableDebugLog}
        handleEnableDebugLogCheck={handleEnableDebugLogCheck}
        includeTags={dbtConfig?.includeTags}
        okText={okText}
        onCancel={onCancel}
        onConfigUpdate={updateDbtConfig}
        onSubmit={onSubmit}
      />
    );
  };

  const getS3ConfigFields = () => {
    return (
      <DBTS3Config
        cancelText={cancelText}
        dbtClassificationName={dbtConfig?.dbtClassificationName}
        dbtPrefixConfig={dbtConfig?.dbtPrefixConfig}
        dbtSecurityConfig={dbtConfig?.dbtSecurityConfig}
        dbtUpdateDescriptions={dbtConfig?.dbtUpdateDescriptions}
        enableDebugLog={data.enableDebugLog}
        handleEnableDebugLogCheck={handleEnableDebugLogCheck}
        includeTags={dbtConfig?.includeTags}
        okText={okText}
        onCancel={onCancel}
        onConfigUpdate={updateDbtConfig}
        onSubmit={onSubmit}
      />
    );
  };

  const handleGcsTypeChange = (type: GCS_CONFIG) =>
    onChange({
      gcsConfigType: type,
      dbtConfigSource: dbtConfig,
    });

  const getGCSConfigFields = () => {
    return (
      <DBTGCSConfig
        cancelText={cancelText}
        dbtClassificationName={dbtConfig?.dbtClassificationName}
        dbtPrefixConfig={dbtConfig?.dbtPrefixConfig}
        dbtSecurityConfig={dbtConfig?.dbtSecurityConfig}
        dbtUpdateDescriptions={dbtConfig?.dbtUpdateDescriptions}
        enableDebugLog={data.enableDebugLog}
        gcsType={gcsConfigType}
        handleEnableDebugLogCheck={handleEnableDebugLogCheck}
        handleGcsTypeChange={handleGcsTypeChange}
        includeTags={dbtConfig?.includeTags}
        okText={okText}
        onCancel={onCancel}
        onConfigUpdate={updateDbtConfig}
        onSubmit={onSubmit}
      />
    );
  };

  const getFields = () => {
    switch (currentDbtConfigSourceType) {
      case DBT_SOURCES.cloud: {
        return getCloudConfigFields();
      }
      case DBT_SOURCES.local: {
        return getLocalConfigFields();
      }
      case DBT_SOURCES.http: {
        return getHttpConfigFields();
      }
      case DBT_SOURCES.s3: {
        return getS3ConfigFields();
      }
      case DBT_SOURCES.gcs: {
        return getGCSConfigFields();
      }
      default: {
        return (
          <Fragment>
            <span data-testid="dbt-source-none">
              {t('message.no-selected-dbt')}
            </span>
            {getSeparator('')}
            <Space className="w-full justify-end">
              <Button
                className="m-r-xs"
                data-testid="back-button"
                type="link"
                onClick={onCancel}>
                {cancelText}
              </Button>

              <Button
                className="font-medium p-x-md p-y-xxs h-auto rounded-6"
                data-testid="submit-btn"
                type="primary"
                onClick={() => onSubmit()}>
                {okText}
              </Button>
            </Space>
          </Fragment>
        );
      }
    }
  };

  useEffect(() => {
    setDbtConfig(dbtConfigSource);
  }, [data, dbtConfigSourceType, gcsConfigType]);

  const commonFields: FieldProp[] = [
    {
      name: 'name',
      label: t('label.name'),
      type: FieldTypes.TEXT,
      required: true,
      props: {
        disabled: formType === FormSubmitType.EDIT,
        'data-testid': 'name',
      },
      id: 'root/name',
      helperText: t('message.instance-identifier'),
      formItemProps: {
        initialValue: ingestionName,
      },
    },
    {
      name: 'dbtConfigSource',
      id: 'root/dbtConfigSource',
      label: t('label.dbt-configuration-source'),
      type: FieldTypes.SELECT,
      props: {
        'data-testid': 'dbt-source',
        options: DBTSources,
      },
      required: false,
      formItemProps: {
        initialValue: dbtConfigSourceType,
      },
    },
  ];

  const handleFormSubmit: FormProps['onFinish'] = async (value) => {
    switch (currentDbtConfigSourceType) {
      case DBT_SOURCES.local:
        {
          onChange({
            dbtConfigSourceType: currentDbtConfigSourceType,
            dbtConfigSource: {
              dbtCatalogFilePath: value?.dbtCatalogFilePath,
              dbtManifestFilePath: value?.dbtManifestFilePath,
              dbtRunResultsFilePath: value?.dbtRunResultsFilePath,
              dbtUpdateDescriptions: value?.dbtUpdateDescriptions,
              dbtClassificationName: value?.dbtClassificationName,
              includeTags: value?.includeTags,
            },
            ingestionName: value?.name,
            enableDebugLog: value?.loggerLevel,
          });
          onSubmit();
        }

        break;

      default:
        break;
    }
  };

  return (
    <Form
      className="p-x-xs configure-ingestion-form"
      form={form}
      layout="vertical"
      onFinish={handleFormSubmit}
      onFocus={(e) => onFocus(e.target.id)}>
      {generateFormFields(commonFields)}
      {getFields()}
      <Space className="w-full justify-end">
        <Button
          className="m-r-xs"
          data-testid="back-button"
          type="link"
          onClick={onCancel}>
          {cancelText}
        </Button>

        <Button
          className="font-medium p-x-md p-y-xxs h-auto rounded-6"
          data-testid="submit-btn"
          htmlType="submit"
          type="primary">
          {okText}
        </Button>
      </Space>
    </Form>
  );
};

export default DBTConfigFormBuilder;
