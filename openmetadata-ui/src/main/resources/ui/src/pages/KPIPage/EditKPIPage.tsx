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
  Slider,
  Space,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import { isUndefined, toNumber } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import RichTextEditor from '../../components/common/rich-text-editor/RichTextEditor';
import TitleBreadcrumb from '../../components/common/title-breadcrumb/title-breadcrumb.component';
import './KPIPage.less';

import { getChartById } from '../../axiosAPIs/DataInsightAPI';
import { getKPIByName, putKPI } from '../../axiosAPIs/KpiAPI';
import Loader from '../../components/Loader/Loader';
import { ROUTES } from '../../constants/constants';
import { VALIDATE_MESSAGES } from '../../constants/DataInsight.constants';
import { ADD_KPI_TEXT } from '../../constants/HelperTextUtil';
import { DataInsightChart } from '../../generated/dataInsight/dataInsightChart';
import { Kpi, KpiTargetType } from '../../generated/dataInsight/kpi/kpi';
import {
  getLocaleDateFromTimeStamp,
  getUTCDateTime,
} from '../../utils/TimeUtils';
import { showErrorToast } from '../../utils/ToastUtils';

const AddKPIPage = () => {
  const { kpiName } = useParams<{ kpiName: string }>();

  const { t } = useTranslation();
  const history = useHistory();

  const [kpiData, setKpiData] = useState<Kpi>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [description, setDescription] = useState<string>('');

  const [selectedChart, setSelectedChart] = useState<DataInsightChart>();

  const [metricValue, setMetricValue] = useState<number>(0);
  const [isUpdatingKPI, setIsUpdatingKPI] = useState<boolean>(false);

  const breadcrumb = useMemo(
    () => [
      {
        name: 'Data Insights',
        url: ROUTES.DATA_INSIGHT,
      },
      {
        name: 'KPI List',
        url: ROUTES.KPI_LIST,
      },
      {
        name: kpiData?.name ?? '',
        url: '',
        activeTitle: true,
      },
    ],
    [kpiData]
  );

  const metricData = useMemo(() => {
    if (kpiData) {
      return kpiData.targetDefinition[0];
    }

    return;
  }, [kpiData]);

  const initialValues = useMemo(() => {
    if (kpiData) {
      const metric = kpiData.targetDefinition[0];
      const chart = kpiData.dataInsightChart;
      const startDate = getLocaleDateFromTimeStamp(kpiData.startDate * 1000);
      const endDate = getLocaleDateFromTimeStamp(kpiData.endDate * 1000);

      return {
        name: kpiData.name,
        displayName: kpiData.displayName,
        dataInsightChart: chart.displayName || chart.name,
        metricType: metric.name,
        startDate,
        endDate,
      };
    }

    return {};
  }, [kpiData]);

  const fetchKPI = async () => {
    setIsLoading(true);
    try {
      const response = await getKPIByName(kpiName, {
        fields:
          'startDate,endDate,targetDefinition,dataInsightChart,metricType',
      });
      setKpiData(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartData = async () => {
    const chartId = kpiData?.dataInsightChart.id;
    if (chartId) {
      try {
        const response = await getChartById(chartId);
        setSelectedChart(response);
      } catch (error) {
        showErrorToast(error as AxiosError);
      }
    }
  };

  const handleCancel = () => history.goBack();

  const handleSubmit: FormProps['onFinish'] = async (values) => {
    if (kpiData && metricData) {
      const startDate = Math.floor(getUTCDateTime(values.startDate) / 1000);
      const endDate = Math.floor(getUTCDateTime(values.endDate) / 1000);
      const formData: Kpi = {
        dataInsightChart: kpiData.dataInsightChart,
        description,
        displayName: values.displayName,
        endDate,
        metricType: kpiData.metricType,
        name: kpiData.name,
        startDate,
        targetDefinition: [
          {
            ...metricData,
            value: metricValue + '',
          },
        ],
      };

      setIsUpdatingKPI(true);
      try {
        await putKPI(formData);
        history.push(ROUTES.KPI_LIST);
      } catch (error) {
        showErrorToast(error as AxiosError);
      } finally {
        setIsUpdatingKPI(false);
      }
    }
  };

  useEffect(() => {
    fetchKPI();
  }, [kpiName]);

  useEffect(() => {
    if (kpiData) {
      fetchChartData();
      setDescription(kpiData.description);
    }
  }, [kpiData]);

  useEffect(() => {
    const value = metricData?.value;
    if (value) {
      setMetricValue(toNumber(value));
    }
  }, [metricData]);

  if (isLoading) {
    return <Loader />;
  }

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
            initialValues={initialValues}
            layout="vertical"
            validateMessages={VALIDATE_MESSAGES}
            onFinish={handleSubmit}>
            <Form.Item label={t('label.name')} name="name">
              <Input
                disabled
                data-testid="name"
                placeholder="Kpi name"
                type="text"
              />
            </Form.Item>

            <Form.Item label={t('label.display-name')} name="displayName">
              <Input
                data-testid="displayName"
                placeholder="Kpi display name"
                type="text"
              />
            </Form.Item>

            <Form.Item label="Data insight chart" name="dataInsightChart">
              <Input
                disabled
                value={selectedChart?.displayName || selectedChart?.name}
              />
            </Form.Item>

            <Form.Item label={t('label.metric-type')} name="metricType">
              <Input disabled value={metricData?.name} />
            </Form.Item>

            {!isUndefined(metricData) && (
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
                  {kpiData?.metricType === KpiTargetType.Percentage && (
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
                  {kpiData?.metricType === KpiTargetType.Number && (
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
                messageVariables={{ fieldName: 'endDate' }}
                name="endDate"
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
                Back
              </Button>
              <Button
                data-testid="submit-btn"
                form="kpi-form"
                htmlType="submit"
                loading={isUpdatingKPI}
                type="primary">
                Save
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
