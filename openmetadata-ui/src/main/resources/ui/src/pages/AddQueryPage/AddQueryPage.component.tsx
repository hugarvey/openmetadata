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
import { Button, Form, FormProps, Space, Tooltip, Typography } from 'antd';
import { DefaultOptionType } from 'antd/lib/select';
import { AxiosError } from 'axios';
import { AsyncSelect } from 'components/AsyncSelect/AsyncSelect';
import ResizablePanels from 'components/common/ResizablePanels/ResizablePanels';
import RichTextEditor from 'components/common/rich-text-editor/RichTextEditor';
import TitleBreadcrumb from 'components/common/title-breadcrumb/title-breadcrumb.component';
import { TitleBreadcrumbProps } from 'components/common/title-breadcrumb/title-breadcrumb.interface';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import SchemaEditor from 'components/schema-editor/SchemaEditor';
import { HTTP_STATUS_CODE } from 'constants/auth.constants';
import {
  getTableTabPath,
  INITIAL_PAGING_VALUE,
  PAGE_SIZE_MEDIUM,
} from 'constants/constants';
import { NO_PERMISSION_FOR_ACTION } from 'constants/HelperTextUtil';
import { CSMode } from 'enums/codemirror.enum';
import { EntityType } from 'enums/entity.enum';
import { SearchIndex } from 'enums/search.enum';
import { OwnerType } from 'enums/user.enum';
import { CreateQuery } from 'generated/api/data/createQuery';
import { Table } from 'generated/entity/data/table';
import { filter, isEmpty } from 'lodash';
import NodeSQLParser from 'node-sql-parser';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { searchData } from 'rest/miscAPI';
import { postQuery } from 'rest/queryAPI';
import { getTableDetailsByFQN } from 'rest/tableAPI';
import { getCurrentUserId } from 'utils/CommonUtils';
import { getEntityBreadcrumbs, getEntityName } from 'utils/EntityUtils';
import { getCurrentDateTimeStamp } from 'utils/TimeUtils';
import { showErrorToast, showSuccessToast } from 'utils/ToastUtils';

const AddQueryPage = () => {
  const { t } = useTranslation();
  const { datasetFQN } = useParams<{ datasetFQN: string }>();
  const { permissions } = usePermissionProvider();
  const [form] = Form.useForm();
  const [titleBreadcrumb, setTitleBreadcrumb] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);
  const [description, setDescription] = useState<string>('');
  const [sqlQuery, setSqlQuery] = useState<string>('');
  const [table, setTable] = useState<Table>();
  const [initialOptions, setInitialOptions] = useState<DefaultOptionType[]>();
  const [isSaving, setIsSaving] = useState(false);

  const fetchEntityDetails = async () => {
    try {
      const tableRes = await getTableDetailsByFQN(datasetFQN, '');
      setTable(tableRes);
      setTitleBreadcrumb([
        ...getEntityBreadcrumbs(tableRes, EntityType.TABLE),
        {
          name: getEntityName(tableRes),
          url: getTableTabPath(datasetFQN, 'table_queries'),
        },
        {
          name: t('label.add-entity', {
            entity: t('label.query'),
          }),
          url: '',
          activeTitle: true,
        },
      ]);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const fetchTableEntity = async (
    searchValue = ''
  ): Promise<DefaultOptionType[]> => {
    try {
      const { data } = await searchData(
        searchValue,
        INITIAL_PAGING_VALUE,
        PAGE_SIZE_MEDIUM,
        '',
        '',
        '',
        SearchIndex.TABLE
      );
      const options = data.hits.hits.map((value) => ({
        label: getEntityName(value._source),
        value: value._source.id,
      }));

      return table
        ? filter(options, ({ value }) => value !== table.id)
        : options;
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    if (datasetFQN) {
      fetchEntityDetails();
    }
  }, [datasetFQN]);

  const getInitialOptions = async () => {
    try {
      const option = await fetchTableEntity();
      setInitialOptions(option);
    } catch (error) {
      setInitialOptions([]);
    }
  };

  useEffect(() => {
    if (table) {
      getInitialOptions();
    }
  }, [table]);

  const handleCancelClick = () => {
    history.back();
  };

  const handleSubmit: FormProps['onFinish'] = async (values) => {
    const updatedValues: CreateQuery = {
      ...values,
      description: isEmpty(description) ? undefined : description,
      owner: {
        id: getCurrentUserId(),
        type: OwnerType.USER,
      },
      queryUsedIn: [
        {
          id: table?.id ?? '',
          type: EntityType.TABLE,
        },
        ...(values.queryUsedIn || []).map((id: string) => ({
          id,
          type: EntityType.TABLE,
        })),
      ],
      queryDate: getCurrentDateTimeStamp(),
    };

    try {
      await postQuery(updatedValues);
      showSuccessToast(
        t('server.create-entity-success', { entity: t('label.query') })
      );
      setIsSaving(false);
      handleCancelClick();
    } catch (error) {
      if (
        (error as AxiosError).response?.status === HTTP_STATUS_CODE.CONFLICT
      ) {
        showErrorToast(
          t('server.entity-already-exist-message-without-name', {
            entity: t('label.query'),
            entityPlural: t('label.query-lowercase-plural'),
          })
        );
      } else {
        showErrorToast(
          t('server.create-entity-error', {
            entity: t('label.query-plural'),
          })
        );
      }
      setIsSaving(false);
    }
  };

  const sqlValidator = async (_: Record<string, any>, value: string) => {
    if (!value) {
      return Promise.resolve('OK');
    }

    try {
      const parser = new NodeSQLParser.Parser();
      parser.astify(value);

      return Promise.resolve('OK');
    } catch (error) {
      return Promise.reject('Error');
    }
  };

  return (
    <ResizablePanels
      firstPanel={{
        children: (
          <div className="max-width-md w-9/10 service-form-container">
            <TitleBreadcrumb titleLinks={titleBreadcrumb} />
            <div className="m-t-md">
              <Typography.Paragraph
                className="text-base"
                data-testid="form-title">
                {t('label.add-new-entity', { entity: t('label.query') })}
              </Typography.Paragraph>
              <Form
                data-testid="query-form"
                form={form}
                id="query-form"
                initialValues={{
                  queryUsedIn: table ? [table.id] : undefined,
                }}
                layout="vertical"
                validateTrigger="onSubmit"
                onFinish={handleSubmit}>
                <Form.Item
                  data-testid="sql-editor-container"
                  label={t('label.sql-uppercase-query')}
                  name="query"
                  rules={[
                    {
                      required: true,
                      message: t('label.field-required', {
                        field: t('label.sql-uppercase-query'),
                      }),
                    },
                    {
                      validator: sqlValidator,
                      message: t('message.field-text-is-invalid', {
                        fieldText: t('label.sql-uppercase-query'),
                      }),
                    },
                  ]}>
                  <SchemaEditor
                    className="custom-query-editor query-editor-h-200 custom-code-mirror-theme"
                    mode={{ name: CSMode.SQL }}
                    options={{
                      readOnly: false,
                    }}
                    value={sqlQuery}
                    onChange={(value) => setSqlQuery(value)}
                  />
                </Form.Item>
                <Form.Item
                  label={`${t('label.description')}:`}
                  name="description">
                  <RichTextEditor
                    height="200px"
                    initialValue={description}
                    placeHolder={t('message.write-your-description')}
                    style={{ margin: 0 }}
                    onTextChange={(value) => setDescription(value)}
                  />
                </Form.Item>
                <Form.Item
                  label={`${t('label.query-used-in')}:`}
                  name="queryUsedIn">
                  <AsyncSelect
                    api={fetchTableEntity}
                    mode="multiple"
                    options={initialOptions}
                    placeholder={t('label.please-select-entity', {
                      entity: t('label.query-used-in'),
                    })}
                  />
                </Form.Item>
                <Form.Item>
                  <Space className="w-full justify-end" size={16}>
                    <Button
                      data-testid="cancel-btn"
                      type="default"
                      onClick={handleCancelClick}>
                      {t('label.cancel')}
                    </Button>
                    <Tooltip
                      placement="top"
                      title={
                        !permissions.query?.Create && NO_PERMISSION_FOR_ACTION
                      }>
                      <Button
                        data-testid="save-btn"
                        disabled={!permissions.query?.Create}
                        htmlType="submit"
                        loading={isSaving}
                        type="primary">
                        {t('label.save')}
                      </Button>
                    </Tooltip>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          </div>
        ),
        minWidth: 700,
        flex: 0.7,
      }}
      pageTitle={t('label.add-entity', { entity: t('label.query') })}
      secondPanel={{
        children: (
          <>
            <Typography.Paragraph className="text-base font-medium">
              {t('label.add-entity', {
                entity: t('label.query'),
              })}
            </Typography.Paragraph>
            <Typography.Text>
              {t('message.add-query-helper-message')}
            </Typography.Text>
          </>
        ),
        className: 'p-md service-doc-panel',
        minWidth: 60,
        overlay: {
          displayThreshold: 200,
          header: t('label.setup-guide'),
          rotation: 'counter-clockwise',
        },
      }}
    />
  );
};

export default AddQueryPage;
