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

import { Space, Table } from 'antd';
import { ColumnsType } from 'antd/lib/table';
import { AxiosError } from 'axios';
import { isEmpty } from 'lodash';
import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';
import { getListTestCaseResults } from '../../../axiosAPIs/testAPI';
import { API_RES_MAX_SIZE } from '../../../constants/constants';
import { PROFILER_FILTER_RANGE } from '../../../constants/profiler.constant';
import { TestCase, TestCaseResult } from '../../../generated/tests/testCase';
import SVGIcons from '../../../utils/SvgUtils';
import { getTestResultBadgeIcon } from '../../../utils/TableUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import { DataQualityTabProps } from '../profilerDashboard.interface';
import TestSummary from './TestSummary';

const DataQualityTab: React.FC<DataQualityTabProps> = ({
  testCases,
  timeRange,
}) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [selectedCaseFqn, setSelectedCaseFqn] = useState<string>('');
  const columns: ColumnsType<TestCase> = useMemo(() => {
    return [
      {
        title: 'Last Run Result',
        dataIndex: 'testCaseResult',
        key: 'testCaseResult',
        render: (result: TestCaseResult) => (
          <Space size={8}>
            <SVGIcons
              alt="result"
              className="tw-w-4"
              icon={getTestResultBadgeIcon(result.testCaseStatus)}
            />
            <span>{result.testCaseStatus}</span>
          </Space>
        ),
      },
      {
        title: 'Last Run',
        dataIndex: 'testCaseResult',
        key: 'lastRun',
        render: (result: TestCaseResult) =>
          moment.unix(result.timestamp || 0).format('DD/MMM HH:mm'),
      },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        render: () => <span>action</span>,
      },
    ];
  }, []);

  const fetchTestResults = async () => {
    if (isEmpty(selectedCaseFqn)) return;

    try {
      const startTs = moment(PROFILER_FILTER_RANGE[timeRange].days).unix();
      const { data } = await getListTestCaseResults(selectedCaseFqn, {
        startTs,
        limit: API_RES_MAX_SIZE,
      });
      setTestResults(data);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  useEffect(() => {
    fetchTestResults();
  }, [timeRange, selectedCaseFqn]);

  return (
    <Table
      columns={columns}
      dataSource={testCases.map((test) => ({ ...test, key: test.name }))}
      expandable={{
        onExpand(expanded, record) {
          setTestResults([]);
          setSelectedCaseFqn('');
          if (expanded) {
            setSelectedCaseFqn(record.fullyQualifiedName || '');
          }
        },
        rowExpandable: () => true,
        expandedRowRender: (recode) => (
          <TestSummary data={recode} results={testResults} />
        ),
      }}
      pagination={false}
      size="small"
    />
  );
};

export default DataQualityTab;
