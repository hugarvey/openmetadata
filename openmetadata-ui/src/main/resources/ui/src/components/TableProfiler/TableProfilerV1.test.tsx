/*
 *  Copyright 2022 Collate
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

// Library imports
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { TableProfilerProps } from './TableProfiler.interface';
// internel imports
import TableProfilerV1 from './TableProfilerV1';

// mock library imports
jest.mock('react-router-dom', () => ({
  Link: jest
    .fn()
    .mockImplementation(({ children }) => <a href="#">{children}</a>),
}));
jest.mock('antd', () => ({
  Button: jest
    .fn()
    .mockImplementation(({ children, ...props }) => (
      <button {...props}>{children}</button>
    )),

  Col: jest
    .fn()
    .mockImplementation(({ children, ...props }) => (
      <div {...props}>{children}</div>
    )),
  Row: jest
    .fn()
    .mockImplementation(({ children, ...props }) => (
      <div {...props}>{children}</div>
    )),
}));

// mock internel imports
jest.mock('./Component/ProfilerSettingsModal', () => {
  return jest.fn().mockImplementation(() => {
    return <div>ProfilerSettingsModal.component</div>;
  });
});
jest.mock('./Component/ColumnProfileTable', () => {
  return jest.fn().mockImplementation(() => {
    return <div>ColumnProfileTable.component</div>;
  });
});
jest.mock('../../utils/DatasetDetailsUtils');
jest.mock('../../utils/CommonUtils', () => ({
  formatNumberWithComma: jest.fn(),
  formTwoDigitNmber: jest.fn(),
}));
// const mockGetCurrentDatasetTab = getCurrentDatasetTab as jest.Mock;

const mockProps: TableProfilerProps = {
  columns: [],
  onAddTestClick: jest.fn(),
  tableProfile: {
    timestamp: 1659764894,
    columnCount: 12,
    rowCount: 14567,
    columnProfile: [
      {
        name: 'shop_id',
        valuesCount: 14567,
        nullCount: 0,
        nullProportion: 0,
        uniqueCount: 14567,
        uniqueProportion: 1,
        distinctCount: 14509,
        distinctProportion: 1,
        min: 1,
        max: 587,
        mean: 45,
        sum: 1367,
        stddev: 35,
        median: 7654,
      },
      {
        name: 'address_id',
        valuesCount: 14567,
        nullCount: 0,
        nullProportion: 0,
        uniqueCount: 14567,
        uniqueProportion: 1,
        distinctCount: 14509,
        distinctProportion: 1,
        min: 1,
        max: 14509,
        mean: 567,
        sum: 34526,
        stddev: 190,
        median: 7654,
      },
    ],
  },
};

describe('Test TableProfiler component', () => {
  beforeEach(() => {
    cleanup();
  });

  it('should render without crashing', async () => {
    render(<TableProfilerV1 {...mockProps} />);

    const profileContainer = await screen.findByTestId(
      'table-profiler-container'
    );
    const settingBtn = await screen.findByTestId('profiler-setting-btn');
    const addTableTest = await screen.findByTestId(
      'profiler-add-table-test-btn'
    );

    expect(profileContainer).toBeInTheDocument();
    expect(settingBtn).toBeInTheDocument();
    expect(addTableTest).toBeInTheDocument();
  });

  it('No data placeholder should be visible where there is no profiler', async () => {
    render(<TableProfilerV1 {...mockProps} tableProfile={undefined} />);

    const noProfiler = await screen.findByTestId(
      'no-profiler-placeholder-container'
    );

    expect(noProfiler).toBeInTheDocument();
  });
});
