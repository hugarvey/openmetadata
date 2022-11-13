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

import { TooltipProps } from 'recharts';
import { DataReportIndex } from '../generated/dataInsight/dataInsightChart';
import { DataInsightChartType } from '../generated/dataInsight/dataInsightChartResult';

export interface ChartAggregateParam {
  dataInsightChartName: DataInsightChartType;
  dataReportIndex: DataReportIndex;
  startTs: number;
  endTs: number;
  tier?: string;
  team?: string;
}

export interface ChartFilter {
  team?: string;
  tier?: string;
  startTs: number;
  endTs: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DataInsightChartTooltipProps extends TooltipProps<any, any> {
  isPercentage?: boolean;
}
