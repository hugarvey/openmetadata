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

import classNames from 'classnames';
import { isNil, uniqueId } from 'lodash';
import moment from 'moment';
import React, { FC, Fragment, HTMLAttributes, useState } from 'react';
import Select, { SingleValue } from 'react-select';
import { Pipeline, StatusType } from '../../generated/entity/data/pipeline';
import { withLoader } from '../../hoc/withLoader';
import { reactSingleSelectCustomStyle } from '../common/react-select-component/reactSelectCustomStyle';

interface Prop extends HTMLAttributes<HTMLDivElement> {
  pipelineStatus: Pipeline['pipelineStatus'];
}

interface Option {
  value: string;
  label: string;
}

const getModifiedPipelineStatus = (
  pipelineStatus: Pipeline['pipelineStatus'] = [],
  status: StatusType
) => {
  const data = pipelineStatus.map((pipelineStatus) => {
    return pipelineStatus.taskStatus?.map((task) => ({
      executionDate: pipelineStatus.executionDate,
      executionStatus: task.executionStatus,
      name: task.name,
    }));
  });

  if (!status) {
    return data.flat(1);
  } else {
    return data.flat(1).filter((d) => d?.executionStatus === status);
  }
};

const getStatusBadge = (status: StatusType) => {
  let className = '';

  switch (status) {
    case StatusType.Successful:
      className = 'tw-bg-status-success';

      break;

    case StatusType.Failed:
      className = 'tw-bg-status-failed';

      break;

    case StatusType.Pending:
      className = 'tw-bg-status-queued';

      break;

    default:
      break;
  }

  return (
    <div className={classNames(className, 'tw-w-4 tw-h-4 tw-rounded-sm')} />
  );
};

const STATUS_OPTIONS = [
  { value: StatusType.Successful, label: StatusType.Successful },
  { value: StatusType.Failed, label: StatusType.Failed },
  { value: StatusType.Pending, label: StatusType.Pending },
];

const PipelineStatusList: FC<Prop> = ({ className, pipelineStatus }: Prop) => {
  const [selectedFilter, setSelectedFilter] = useState('');

  const handleOnChange = (value: SingleValue<unknown>) => {
    const selectedValue = value as Option;
    setSelectedFilter(selectedValue.value);
  };

  if (isNil(pipelineStatus)) {
    return null;
  } else {
    return (
      <Fragment>
        {pipelineStatus.length > 0 ? (
          <div className={className} data-testid="pipeline-status-list">
            <div className="tw-flex tw-justify-between tw-mt-2 tw-mb-4">
              <div />
              <Select
                options={STATUS_OPTIONS}
                placeholder="Status"
                styles={reactSingleSelectCustomStyle}
                onChange={handleOnChange}
              />
            </div>
            <table
              className="tw-w-full"
              data-testid="pipeline-status-table"
              id="pipeline-status-table">
              <thead>
                <tr className="tableHead-row">
                  <th className="tableHead-cell">Task Name</th>
                  <th className="tableHead-cell">Status</th>
                  <th className="tableHead-cell">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="tableBody">
                {getModifiedPipelineStatus(
                  pipelineStatus,
                  selectedFilter as StatusType
                ).map((status) => (
                  <tr
                    className={classNames('tableBody-row')}
                    data-testid="tableBody-row"
                    key={uniqueId()}>
                    <td className="tableBody-cell" data-testid="tableBody-cell">
                      {status?.name}
                    </td>
                    <td className="tableBody-cell" data-testid="tableBody-cell">
                      <div className="tw-flex tw-items-center">
                        {getStatusBadge(status?.executionStatus as StatusType)}{' '}
                        <span className="tw-ml-2">
                          {status?.executionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="tableBody-cell" data-testid="tableBody-cell">
                      {status?.executionDate
                        ? moment(status?.executionDate).format(
                            'DD-MM-YYYY hh:mm A'
                          )
                        : '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tw-mt-4 tw-ml-4 tw-flex tw-justify-center tw-font-medium tw-items-center tw-border tw-border-main tw-rounded-md tw-p-8">
            <span>No Execution data available.</span>
          </div>
        )}
      </Fragment>
    );
  }
};

export default withLoader<Prop>(PipelineStatusList);
