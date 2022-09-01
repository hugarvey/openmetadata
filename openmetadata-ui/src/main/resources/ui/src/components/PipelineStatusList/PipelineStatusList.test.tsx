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

import { render } from '@testing-library/react';
import React from 'react';
import { Pipeline } from '../../generated/entity/data/pipeline';
import PipelineStatusListComponent from './PipelineStatusList.component';

const mockPipelineStatus: Pipeline['pipelineStatus'] = {
  executionDate: 1649669589,
  executionStatus: 'Successful',
  taskStatus: [
    {
      name: 'dim_address_task',
      executionStatus: 'Successful',
    },
    {
      name: 'assert_table_exists',
      executionStatus: 'Successful',
    },
  ],
} as Pipeline['pipelineStatus'];

const mockSelectExec = jest.fn();

jest.mock('../../utils/PipelineDetailsUtils', () => ({
  STATUS_OPTIONS: [],
}));

jest.mock('../ExecutionStrip/ExecutionStrip', () => {
  return jest
    .fn()
    .mockReturnValue(<p data-testid="exec-strip">Execution Strip</p>);
});

jest.mock('../../axiosAPIs/pipelineAPI', () => ({
  getPipelineStatus: jest.fn().mockImplementation(() =>
    Promise.resolve([
      {
        executionDate: 1649669589,
        executionStatus: 'Successful',
        name: 'dim_address_task',
      },
    ])
  ),
}));

describe('Test PipelineStatus list component', () => {
  it('Should render all child elements', async () => {
    const { findByTestId } = render(
      <PipelineStatusListComponent
        pipelineFQN="testfqn"
        pipelineStatus={mockPipelineStatus}
        selectedExec={mockPipelineStatus || {}}
        onSelectExecution={mockSelectExec}
      />
    );

    const filterDropDown = await findByTestId('filter-dropdown');

    const executionStrip = await findByTestId('exec-strip');

    expect(filterDropDown).toBeInTheDocument();
    expect(executionStrip).toBeInTheDocument();
  });

  it('Should render no data placeholder if pipelinestatus is undefined', async () => {
    const { findByTestId } = render(
      <PipelineStatusListComponent
        pipelineFQN="testfqn"
        pipelineStatus={undefined}
        selectedExec={{}}
        onSelectExecution={mockSelectExec}
      />
    );

    const noData = await findByTestId('no-data');

    expect(noData).toBeInTheDocument();
  });

  it('Should render no data placeholder if pipelinestatus is empty list', async () => {
    const { findByTestId } = render(
      <PipelineStatusListComponent
        pipelineFQN="testfqn"
        pipelineStatus={{}}
        selectedExec={{}}
        onSelectExecution={mockSelectExec}
      />
    );

    const noData = await findByTestId('no-data');

    expect(noData).toBeInTheDocument();
  });
});
