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

import { Card, Col, Row } from 'antd';
import { AxiosError } from 'axios';
import PageHeader from 'components/header/PageHeader.component';
import { isEmpty, round } from 'lodash';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  LegendProps,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getAggregateChartData } from 'rest/DataInsightAPI';
import {
  DEFAULT_CHART_OPACITY,
  GRAPH_BACKGROUND_COLOR,
  HOVER_CHART_OPACITY,
} from '../../constants/constants';
import {
  BAR_CHART_MARGIN,
  DI_STRUCTURE,
  TOTAL_ENTITY_CHART_COLOR,
} from '../../constants/DataInsight.constants';
import { DataReportIndex } from '../../generated/dataInsight/dataInsightChart';
import {
  DataInsightChartResult,
  DataInsightChartType,
} from '../../generated/dataInsight/dataInsightChartResult';
import { Kpi } from '../../generated/dataInsight/kpi/kpi';
import { ChartFilter } from '../../interface/data-insight.interface';
import {
  axisTickFormatter,
  updateActiveChartFilter,
} from '../../utils/ChartUtils';
import {
  CustomTooltip,
  getGraphDataByEntityType,
  renderLegend,
} from '../../utils/DataInsightUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import './DataInsightDetail.less';
import DataInsightProgressBar from './DataInsightProgressBar';
import { EmptyGraphPlaceholder } from './EmptyGraphPlaceholder';
import EntitySummaryProgressBar from './EntitySummaryProgressBar.component';

interface Props {
  chartFilter: ChartFilter;
  kpi: Kpi | undefined;
  selectedDays: number;
}

const OwnerInsight: FC<Props> = ({ chartFilter, kpi, selectedDays }) => {
  const [totalEntitiesOwnerByType, setTotalEntitiesOwnerByType] =
    useState<DataInsightChartResult>();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [activeMouseHoverKey, setActiveMouseHoverKey] = useState('');

  const {
    data,
    entities,
    total,
    relativePercentage,
    latestData,
    isPercentageGraph,
  } = useMemo(() => {
    return getGraphDataByEntityType(
      totalEntitiesOwnerByType?.data ?? [],
      DataInsightChartType.PercentageOfEntitiesWithOwnerByType
    );
  }, [totalEntitiesOwnerByType]);

  const targetValue = useMemo(() => {
    if (kpi?.targetDefinition) {
      return Number(kpi.targetDefinition[0].value) * 100;
    }

    return undefined;
  }, [kpi]);

  const { t } = useTranslation();

  const fetchTotalEntitiesOwnerByType = async () => {
    setIsLoading(true);
    try {
      const params = {
        ...chartFilter,
        dataInsightChartName:
          DataInsightChartType.PercentageOfEntitiesWithOwnerByType,
        dataReportIndex: DataReportIndex.EntityReportDataIndex,
      };
      const response = await getAggregateChartData(params);

      setTotalEntitiesOwnerByType(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLegendClick: LegendProps['onClick'] = (event) => {
    setActiveKeys((prevActiveKeys) =>
      updateActiveChartFilter(event.dataKey, prevActiveKeys)
    );
  };
  const handleLegendMouseEnter: LegendProps['onMouseEnter'] = (event) => {
    setActiveMouseHoverKey(event.dataKey);
  };
  const handleLegendMouseLeave: LegendProps['onMouseLeave'] = () => {
    setActiveMouseHoverKey('');
  };

  useEffect(() => {
    fetchTotalEntitiesOwnerByType();
  }, [chartFilter]);

  return (
    <Card
      className="data-insight-card"
      data-testid="entity-summary-card-percentage"
      id={DataInsightChartType.PercentageOfEntitiesWithOwnerByType}
      loading={isLoading}
      title={
        <PageHeader
          data={{
            header: t('label.data-insight-owner-summary'),
            subHeader: t('message.field-insight', {
              field: t('label.owner'),
            }),
          }}
        />
      }>
      {data.length ? (
        <Row gutter={DI_STRUCTURE.rowContainerGutter}>
          <Col span={DI_STRUCTURE.leftContainerSpan}>
            <ResponsiveContainer
              debounce={1}
              id="owner-summary-graph"
              minHeight={400}>
              <LineChart data={data} margin={BAR_CHART_MARGIN}>
                <CartesianGrid
                  stroke={GRAPH_BACKGROUND_COLOR}
                  vertical={false}
                />
                <XAxis dataKey="timestamp" />
                <YAxis
                  tickFormatter={(value: number) =>
                    axisTickFormatter(value, '%')
                  }
                />
                <Tooltip content={<CustomTooltip isPercentage />} />
                <Legend
                  align="left"
                  content={(props) =>
                    renderLegend(props as LegendProps, activeKeys)
                  }
                  layout="horizontal"
                  verticalAlign="top"
                  wrapperStyle={{ left: '0px', top: '0px' }}
                  onClick={handleLegendClick}
                  onMouseEnter={handleLegendMouseEnter}
                  onMouseLeave={handleLegendMouseLeave}
                />
                {entities.map((entity, i) => (
                  <Line
                    dataKey={entity}
                    hide={
                      activeKeys.length && entity !== activeMouseHoverKey
                        ? !activeKeys.includes(entity)
                        : false
                    }
                    key={entity}
                    stroke={TOTAL_ENTITY_CHART_COLOR[i]}
                    strokeOpacity={
                      isEmpty(activeMouseHoverKey) ||
                      entity === activeMouseHoverKey
                        ? DEFAULT_CHART_OPACITY
                        : HOVER_CHART_OPACITY
                    }
                    type="monotone"
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Col>
          <Col span={DI_STRUCTURE.rightContainerSpan}>
            <Row gutter={DI_STRUCTURE.rightRowGutter}>
              <Col span={24}>
                <DataInsightProgressBar
                  changeInValue={relativePercentage}
                  className="m-b-md"
                  duration={selectedDays}
                  label={`${t('label.assigned-entity', {
                    entity: t('label.owner'),
                  })}
                  ${isPercentageGraph ? ' %' : ''}`}
                  progress={Number(total)}
                  suffix={isPercentageGraph ? '%' : ''}
                  target={targetValue}
                />
              </Col>
              {entities.map((entity, i) => {
                return (
                  <Col key={entity} span={24}>
                    <EntitySummaryProgressBar
                      entity={entity}
                      label={`${round(latestData[entity] || 0, 2)}${
                        isPercentageGraph ? '%' : ''
                      }`}
                      latestData={latestData}
                      progress={latestData[entity]}
                      strokeColor={TOTAL_ENTITY_CHART_COLOR[i]}
                    />
                  </Col>
                );
              })}
            </Row>
          </Col>
        </Row>
      ) : (
        <EmptyGraphPlaceholder />
      )}
    </Card>
  );
};

export default OwnerInsight;
