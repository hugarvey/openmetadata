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

import {
  Button,
  Card,
  Col,
  Form,
  FormProps,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
  Space,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { isUndefined } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { getListDataInsightCharts } from '../../axiosAPIs/DataInsightAPI';
import RichTextEditor from '../../components/common/rich-text-editor/RichTextEditor';
import TitleBreadcrumb from '../../components/common/title-breadcrumb/title-breadcrumb.component';
import './KPIPage.less';

import { postKPI } from '../../axiosAPIs/KpiAPI';
import { ROUTES } from '../../constants/constants';
import {
  SUPPORTED_CHARTS_FOR_KPI,
  VALIDATE_MESSAGES,
} from '../../constants/DataInsight.constants';
import { ADD_KPI_TEXT } from '../../constants/HelperTextUtil';
import { EntityType } from '../../enums/entity.enum';
import { KpiTargetType } from '../../generated/api/dataInsight/kpi/createKpiRequest';
import {
  ChartParameterValues,
  DataInsightChart,
  DataType,
} from '../../generated/dataInsight/dataInsightChart';
import { DataInsightChartType } from '../../generated/dataInsight/dataInsightChartResult';
import { getUTCDateTime } from '../../utils/TimeUtils';
import { showErrorToast } from '../../utils/ToastUtils';
const { Option } = Select;

const breadcrumb = [
  {
    name: 'Data Insights',
    url: ROUTES.DATA_INSIGHT,
  },
  {
    name: 'KPI List',
    url: ROUTES.KPI_LIST,
  },
  {
    name: 'Add New KPI',
    url: '',
    activeTitle: true,
  },
];

const AddKPIPage = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const [dataInsightCharts, setDataInsightCharts] = useState<
    DataInsightChart[]
  >([]);
  const [description, setDescription] = useState<string>('');
  const [selectedChart, setSelectedChart] = useState<DataInsightChart>();
  const [selectedMetric, setSelectedMetric] = useState<ChartParameterValues>();
  const [metricValue, setMetricValue] = useState<number>(0);
  const [isCreatingKPI, setIsCreatingKPI] = useState<boolean>(false);

  const metricTypes = useMemo(
    () =>
      (selectedChart?.metrics ?? []).filter((metric) =>
        // only return supported data type
        [DataType.Number, DataType.Percentage].includes(
          metric.dataType as DataType
        )
      ),
    [selectedChart]
  );

  const fetchCharts = async () => {
    try {
      const response = await getListDataInsightCharts();
      const supportedCharts = response.data.filter((chart) =>
        // only return the supported charts data
        SUPPORTED_CHARTS_FOR_KPI.includes(chart.name as DataInsightChartType)
      );

      setDataInsightCharts(supportedCharts);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const handleChartSelect = (value: string) => {
    const selectedChartValue = dataInsightCharts.find(
      (chart) => chart.id === value
    );
    setSelectedChart(selectedChartValue);
  };

  const handleMetricSelect = (value: string) => {
    const selectedMetricValue = metricTypes.find(
      (metric) => metric.name === value
    );
    setSelectedMetric(selectedMetricValue);
  };

  const handleCancel = () => history.goBack();

  const handleSubmit: FormProps['onFinish'] = async (values) => {
    const startDate = Math.floor(getUTCDateTime(values.startDate) / 1000);
    const endDate = Math.floor(getUTCDateTime(values.endtDate) / 1000);
    const formData = {
      dataInsightChart: {
        id: values.dataInsightChart,
        type: EntityType.DATA_INSIGHT_CHART,
      },
      description,
      name: values.name,
      displayName: values.displayName,
      startDate,
      endDate,
      metricType: selectedMetric?.dataType as unknown as KpiTargetType,
      targetDefinition: [
        {
          name: selectedMetric?.name as string,
          value: metricValue + '',
        },
      ],
    };
    setIsCreatingKPI(true);
    try {
      await postKPI(formData);
      history.push(ROUTES.KPI_LIST);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsCreatingKPI(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  return (
    <Row
      className="tw-bg-body-main tw-h-full"
      data-testid="add-kpi-container"
      gutter={[16, 16]}>
      <Col offset={4} span={12}>
        <TitleBreadcrumb titleLinks={breadcrumb} />
        <Card>
          <Typography.Paragraph
            className="tw-text-base"
            data-testid="form-title">
            {t('label.add-new-kpi')}
          </Typography.Paragraph>
          <Form
            data-testid="kpi-form"
            id="kpi-form"
            layout="vertical"
            validateMessages={VALIDATE_MESSAGES}
            onFinish={handleSubmit}>
            <Form.Item
              label={t('label.name')}
              name="name"
              rules={[
                {
                  required: true,
                  max: 128,
                  min: 1,
                  message: 'Invalid name',
                },
              ]}>
              <Input data-testid="name" placeholder="Kpi name" type="text" />
            </Form.Item>

            <Form.Item label={t('label.display-name')} name="displayName">
              <Input
                data-testid="displayName"
                placeholder="Kpi display name"
                type="text"
              />
            </Form.Item>

            <Form.Item
              label={t('label.select-a-chart')}
              name="dataInsightChart"
              rules={[
                {
                  required: true,
                  message: t('message.data-insight-chart-required'),
                },
              ]}>
              <Select
                data-testid="dataInsightChart"
                placeholder="Select DataInsight Chart"
                value={selectedChart?.id}
                onChange={handleChartSelect}>
                {dataInsightCharts.map((chart) => (
                  <Option key={chart.id}>
                    {chart.displayName || chart.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={t('label.select-a-metric-type')}
              name="metricType"
              rules={[
                {
                  required: true,
                  message: t('message.metric-type-required'),
                },
              ]}>
              <Select
                data-testid="metricType"
                disabled={isUndefined(selectedChart)}
                placeholder="Select a metric type"
                value={selectedMetric?.name}
                onChange={handleMetricSelect}>
                {metricTypes.map((metric) => (
                  <Option key={metric.name}>
                    {`${metric.name} (${metric.dataType})`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {!isUndefined(selectedMetric) && (
              <Form.Item
                label={t('label.metric-value')}
                name="metricValue"
                rules={[
                  {
                    required: true,
                    validator: () => {
                      if (metricValue >= 0) {
                        return Promise.resolve();
                      }

                      return Promise.reject(t('message.metric-value-required'));
                    },
                  },
                ]}>
                <>
                  {selectedMetric.dataType === DataType.Percentage && (
                    <Row gutter={20}>
                      <Col span={20}>
                        <Slider
                          className="kpi-slider"
                          marks={{
                            0: '0%',
                            100: '100%',
                          }}
                          max={100}
                          min={0}
                          tooltipPlacement="bottom"
                          tooltipVisible={false}
                          value={metricValue}
                          onChange={(value) => {
                            setMetricValue(value);
                          }}
                        />
                      </Col>
                      <Col span={4}>
                        <InputNumber
                          formatter={(value) => `${value}%`}
                          max={100}
                          min={0}
                          step={1}
                          value={metricValue}
                          onChange={(value) => {
                            setMetricValue(value);
                          }}
                        />
                      </Col>
                    </Row>
                  )}
                  {selectedMetric.dataType === DataType.Number && (
                    <InputNumber
                      className="w-full"
                      min={0}
                      value={metricValue}
                      onChange={(value) => setMetricValue(value)}
                    />
                  )}
                </>
              </Form.Item>
            )}

            <Space className="w-full kpi-dates-space">
              <Form.Item
                label={t('label.start-date')}
                messageVariables={{ fieldName: 'startDate' }}
                name="startDate"
                rules={[
                  {
                    required: true,
                  },
                ]}>
                <Input type="datetime-local" />
              </Form.Item>

              <Form.Item
                label={t('label.end-date')}
                messageVariables={{ fieldName: 'endtDate' }}
                name="endtDate"
                rules={[
                  {
                    required: true,
                  },
                ]}>
                <Input type="datetime-local" />
              </Form.Item>
            </Space>

            <Form.Item label={t('label.description')} name="description">
              <RichTextEditor
                height="200px"
                initialValue={description}
                placeHolder="write your description"
                style={{ margin: 0 }}
                onTextChange={(value) => setDescription(value)}
              />
            </Form.Item>

            <Space align="center" className="tw-w-full tw-justify-end">
              <Button
                data-testid="cancel-btn"
                type="link"
                onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                data-testid="submit-btn"
                form="kpi-form"
                htmlType="submit"
                loading={isCreatingKPI}
                type="primary">
                Submit
              </Button>
            </Space>
          </Form>
        </Card>
      </Col>
      <Col className="tw-mt-4" span={4}>
        <Typography.Paragraph className="tw-text-base tw-font-medium">
          {t('label.add-kpi')}
        </Typography.Paragraph>
        <Typography.Text>{ADD_KPI_TEXT}</Typography.Text>
      </Col>
    </Row>
  );
};

export default AddKPIPage;
