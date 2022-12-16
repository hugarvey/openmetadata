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

import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-test-renderer';
import { DataInsightChartType } from '../../generated/dataInsight/dataInsightChartResult';
import { DataInsightTabs } from '../../interface/data-insight.interface';
import DataInsightSummary from './DataInsightSummary';

let activeTab = DataInsightTabs.DATA_ASSETS;

const mockFilter = {
  startTs: 1667952000000,
  endTs: 1668000248671,
};

const mockScrollFunction = jest.fn();

jest.mock('react-router-dom', () => ({
  Link: jest
    .fn()
    .mockImplementation(({ children, ...rest }) => <a {...rest}>{children}</a>),
  useParams: jest.fn().mockImplementation(() => ({
    tab: activeTab,
  })),
}));

jest.mock('../../axiosAPIs/DataInsightAPI', () => ({
  getAggregateChartData: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('Test DataInsightSummary Component', () => {
  it('Should render the overview data', async () => {
    await act(async () => {
      render(
        <DataInsightSummary
          chartFilter={mockFilter}
          onScrollToChart={mockScrollFunction}
        />,
        { wrapper: MemoryRouter }
      );
    });

    const summaryCard = screen.getByTestId('summary-card');

    const totalEntitiesByType = screen.getByTestId(
      `summary-item-${DataInsightChartType.TotalEntitiesByType}`
    );

    expect(summaryCard).toBeInTheDocument();
    expect(totalEntitiesByType).toBeInTheDocument();
  });

  it('Should render only the data assets summary', async () => {
    await act(async () => {
      render(
        <DataInsightSummary
          chartFilter={mockFilter}
          onScrollToChart={mockScrollFunction}
        />,
        { wrapper: MemoryRouter }
      );
    });

    const dataAssetSummary = await screen.findByTestId('data-assets-summary');

    expect(dataAssetSummary).toBeInTheDocument();

    // should not render the app analytics summary
    expect(screen.queryByTestId('app-analytics-summary')).toBeNull();
  });

  it('Should render only the app analytics summary', async () => {
    activeTab = DataInsightTabs.APP_ANALYTICS;

    await act(async () => {
      render(
        <DataInsightSummary
          chartFilter={mockFilter}
          onScrollToChart={mockScrollFunction}
        />,
        { wrapper: MemoryRouter }
      );
    });

    const appAnalyticsSummary = await screen.findByTestId(
      'app-analytics-summary'
    );

    expect(appAnalyticsSummary).toBeInTheDocument();

    // should not render the data assets summary
    expect(screen.queryByTestId('data-assets-summary')).toBeNull();
  });
});
