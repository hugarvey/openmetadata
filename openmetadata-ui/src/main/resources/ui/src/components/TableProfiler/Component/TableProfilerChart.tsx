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

import { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getSystemProfileList,
  getTableProfilesList,
} from '../../../axiosAPIs/tableAPI';
import {
  getCurrentDateTimeMillis,
  getCurrentDateTimeStamp,
  getPastDatesTimeStampFromCurrentDate,
  getPastDaysDateTimeMillis,
} from '../../../utils/TimeUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import { TableProfilerData } from '../TableProfiler.interface';

const TableProfilerChart = () => {
  const { datasetFQN } = useParams<{ datasetFQN: string }>();
  const [profilerData, setProfilerData] = useState<TableProfilerData>({
    tableProfilerData: [],
    systemProfilerData: [],
  });

  const fetchTableProfiler = async (fqn: string, days = 3) => {
    try {
      const startTs = getPastDatesTimeStampFromCurrentDate(days);

      const endTs = getCurrentDateTimeStamp();

      const { data } = await getTableProfilesList(fqn, {
        startTs,
        endTs,
      });

      setProfilerData((prev) => ({ ...prev, tableProfilerData: data }));
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };
  const fetchSystemProfiler = async (fqn: string, days = 3) => {
    try {
      const startTs = getPastDaysDateTimeMillis(days);

      const endTs = getCurrentDateTimeMillis();

      const { data } = await getSystemProfileList(fqn, {
        startTs,
        endTs,
      });

      setProfilerData((prev) => ({ ...prev, systemProfilerData: data }));
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const fetchProfilerData = async (fqn: string, days = 3) => {
    fetchTableProfiler(fqn, days);
    fetchSystemProfiler(fqn, days);
  };

  useEffect(() => {
    if (datasetFQN) {
      fetchProfilerData(datasetFQN);
    }
  }, [datasetFQN]);

  return <div>TableProfilerChart</div>;
};

export default TableProfilerChart;
