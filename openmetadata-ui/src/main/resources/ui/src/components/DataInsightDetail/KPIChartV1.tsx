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

import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Tooltip as AntdTooltip,
  Typography,
} from 'antd';
import { AxiosError } from 'axios';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import { ERROR_PLACEHOLDER_TYPE, SIZE } from 'enums/common.enum';
import { isEmpty, isUndefined } from 'lodash';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getLatestKpiResult, getListKpiResult } from 'rest/KpiAPI';
import {
  getCurrentDateTimeMillis,
  getPastDaysDateTimeMillis,
} from 'utils/TimeUtils';
import { GRAPH_BACKGROUND_COLOR, ROUTES } from '../../constants/constants';
import { KPI_WIDGET_GRAPH_COLORS } from '../../constants/DataInsight.constants';
import {
  Kpi,
  KpiResult,
  KpiTargetType,
} from '../../generated/dataInsight/kpi/kpi';
import { useAuth } from '../../hooks/authHooks';
import { UIKpiResult } from '../../interface/data-insight.interface';
import { CustomTooltip, getKpiGraphData } from '../../utils/DataInsightUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import { EmptyGraphPlaceholder } from './EmptyGraphPlaceholder';
import KPILatestResultsV1 from './KPILatestResultsV1';

interface Props {
  kpiList: Array<Kpi>;
  selectedDays: number;
}

const KPIChartV1: FC<Props> = ({ kpiList, selectedDays }) => {
  const { isAdminUser } = useAuth();
  const { t } = useTranslation();
  const history = useHistory();

  const [kpiResults, setKpiResults] = useState<KpiResult[]>([]);
  const [kpiLatestResults, setKpiLatestResults] =
    useState<Record<string, UIKpiResult>>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAddKpi = () => history.push(ROUTES.ADD_KPI);

  const fetchKpiResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = kpiList.map((kpi) =>
        getListKpiResult(kpi.fullyQualifiedName ?? '', {
          startTs: getPastDaysDateTimeMillis(selectedDays),
          endTs: getCurrentDateTimeMillis(),
        })
      );
      const responses = await Promise.allSettled(promises);
      const kpiResultsList: KpiResult[] = [];

      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          kpiResultsList.push(...response.value.data);
        }
      });
      setKpiResults(kpiResultsList);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsLoading(false);
    }
  }, [kpiList, selectedDays]);

  const fetchKpiLatestResults = async () => {
    setIsLoading(true);
    try {
      const promises = kpiList.map((kpi) =>
        getLatestKpiResult(kpi.fullyQualifiedName ?? '')
      );
      const responses = await Promise.allSettled(promises);

      const latestResults = responses.reduce((previous, curr) => {
        if (curr.status === 'fulfilled') {
          const resultValue: KpiResult = curr.value;
          const kpiName = resultValue.kpiFqn ?? '';

          // get the current kpi
          const kpi = kpiList.find((k) => k.fullyQualifiedName === kpiName);

          // get the kpiTarget
          const kpiTarget = kpi?.targetDefinition?.[0];

          if (!isUndefined(kpi) && !isUndefined(kpiTarget)) {
            return {
              ...previous,
              [kpiName]: {
                ...resultValue,
                target: kpiTarget?.value,
                metricType: kpi?.metricType as KpiTargetType,
                startDate: kpi?.startDate,
                endDate: kpi?.endDate,
                displayName: kpi.displayName ?? kpiName,
              },
            };
          }
        }

        return previous;
      }, {} as Record<string, UIKpiResult>);
      setKpiLatestResults(latestResults);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsLoading(false);
    }
  };

  const { kpis, graphData, kpiTooltipRecord } = useMemo(() => {
    const kpiTooltipRecord = kpiList.reduce((previous, curr) => {
      return { ...previous, [curr.name]: curr.metricType };
    }, {});

    return { ...getKpiGraphData(kpiResults, kpiList), kpiTooltipRecord };
  }, [kpiResults, kpiList]);

  useEffect(() => {
    setKpiResults([]);
    setKpiLatestResults(undefined);
  }, [selectedDays]);

  useEffect(() => {
    if (kpiList.length) {
      fetchKpiResults();
      fetchKpiLatestResults();
    }
  }, [kpiList, selectedDays]);

  return (
    <Card
      className="kpi-widget-card"
      data-testid="kpi-card"
      id="kpi-charts"
      loading={isLoading}
      title={
        <div className="p-y-sm">
          <Typography.Text className="text-md font-semibold">
            {t('label.kpi-title')}
          </Typography.Text>
        </div>
      }>
      {kpiList.length ? (
        <Row>
          {graphData.length ? (
            <>
              <Col span={14}>
                <ResponsiveContainer debounce={1} height={250} width="100%">
                  <LineChart
                    data={graphData}
                    margin={{
                      top: 10,
                      right: 50,
                      left: -20,
                      bottom: 0,
                    }}>
                    <CartesianGrid
                      stroke={GRAPH_BACKGROUND_COLOR}
                      vertical={false}
                    />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip
                      content={
                        <CustomTooltip kpiTooltipRecord={kpiTooltipRecord} />
                      }
                    />
                    {kpis.map((kpi, i) => (
                      <Line
                        dataKey={kpi}
                        key={i}
                        stroke={KPI_WIDGET_GRAPH_COLORS[i]}
                        type="monotone"
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Col>
              {!isUndefined(kpiLatestResults) && !isEmpty(kpiLatestResults) && (
                <Col span={10}>
                  <KPILatestResultsV1
                    kpiLatestResultsRecord={kpiLatestResults}
                  />
                </Col>
              )}
            </>
          ) : (
            <Col className="justify-center" span={24}>
              <EmptyGraphPlaceholder />
            </Col>
          )}
        </Row>
      ) : (
        <Space
          className="w-full justify-center items-center"
          direction="vertical">
          <ErrorPlaceHolder
            button={
              <AntdTooltip
                title={!isAdminUser && t('message.no-permission-for-action')}>
                <Button
                  ghost
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={handleAddKpi}>
                  {t('label.add-entity', {
                    entity: t('label.kpi-uppercase'),
                  })}
                </Button>
              </AntdTooltip>
            }
            className="p-y-lg"
            permission={isAdminUser}
            size={SIZE.MEDIUM}
            type={ERROR_PLACEHOLDER_TYPE.ASSIGN}>
            {t('message.no-kpi-available-add-new-one')}
          </ErrorPlaceHolder>
        </Space>
      )}
    </Card>
  );
};

export default KPIChartV1;
