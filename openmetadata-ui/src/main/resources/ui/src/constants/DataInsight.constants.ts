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

import { Margin } from 'recharts/types/util/types';
import { ChartFilter } from '../interface/data-insight.interface';
import {
  getCurrentDateTimeMillis,
  getPastDaysDateTimeMillis,
} from '../utils/TimeUtils';

export const BAR_CHART_MARGIN: Margin = {
  top: 20,
  right: 30,
  left: 20,
  bottom: 5,
};

export const DATA_INSIGHT_GRAPH_COLORS = [
  '#E7B85D',
  '#416BB3',
  '#66B5AD',
  '#8D6AF1',
  '#699994',
  '#6A86EB',
  '#7A57A6',
  '#7DC177',
  '#AD4F82',
  '#C870C5',
  '#D87F7F',
  '#DA996A',
];

export const BAR_SIZE = 15;

export const ENTITIES_BAR_COLO_MAP: Record<string, string> = {
  Chart: '#E7B85D',
  Dashboard: '#416BB3',
  Database: '#66B5AD',
  DatabaseSchema: '#8D6AF1',
  MlModel: '#699994',
  Pipeline: '#6A86EB',
  Table: '#7A57A6',
  Topic: '#7DC177',
  User: '#AD4F82',
  TestSuite: '#C870C5',
};

export const TIER_BAR_COLOR_MAP: Record<string, string> = {
  'Tier.Tier1': '#E7B85D',
  'Tier.Tier2': '#416BB3',
  'Tier.Tier3': '#66B5AD',
  'Tier.Tier4': '#8D6AF1',
  'Tier.Tier5': '#699994',
  'No Tier': '#6A86EB',
};

export const DATA_INSIGHT_TAB = {
  Datasets: 'Datasets',
  'Web Analytics': 'Web Analytics',
};

export const DAY_FILTER = [
  {
    value: 7,
    label: 'Last 7 Days',
  },
  {
    value: 14,
    label: 'Last 14 Days',
  },
  {
    value: 30,
    label: 'Last 30 Days',
  },
  {
    value: 60,
    label: 'Last 60 Days',
  },
];

export const TIER_FILTER = [
  {
    value: 'Tier.Tier1',
    label: 'Tier1',
  },
  {
    value: 'Tier.Tier2',
    label: 'Tier2',
  },
  {
    value: 'Tier.Tier3',
    label: 'Tier3',
  },
  {
    value: 'Tier.Tier4',
    label: 'Tier4',
  },
  {
    value: 'Tier.Tier5',
    label: 'Tier5',
  },
];

export const INITIAL_CHART_FILTER: ChartFilter = {
  startTs: getPastDaysDateTimeMillis(30),
  endTs: getCurrentDateTimeMillis(),
};
