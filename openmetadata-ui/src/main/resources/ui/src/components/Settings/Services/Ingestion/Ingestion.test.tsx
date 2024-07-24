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

import {
  act,
  findByTestId,
  findByText,
  fireEvent,
  getAllByText,
  queryByTestId,
  queryByText,
  render,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { OperationPermission } from '../../../../context/PermissionProvider/PermissionProvider.interface';
import { ServiceCategory } from '../../../../enums/service.enum';
import { IngestionPipeline } from '../../../../generated/entity/services/ingestionPipelines/ingestionPipeline';
import { useAirflowStatus } from '../../../../hooks/useAirflowStatus';
import Ingestion from './Ingestion.component';
import { mockIngestionWorkFlow, mockService } from './Ingestion.mock';

const mockPermissions = {
  Create: true,
  Delete: true,
  EditAll: true,
  EditCustomFields: true,
  EditDataProfile: true,
  EditDescription: true,
  EditDisplayName: true,
  EditLineage: true,
  EditOwners: true,
  EditQueries: true,
  EditSampleData: true,
  EditTags: true,
  EditTests: true,
  EditTier: true,
  ViewAll: true,
  ViewDataProfile: true,
  ViewQueries: true,
  ViewSampleData: true,
  ViewTests: true,
  ViewUsage: true,
} as OperationPermission;

const mockUpdateWorkflows = jest.fn();

const mockPaging = {
  after: 'after',
  before: 'before',
  total: 1,
};

const mockDeleteIngestion = jest.fn();
const handleEnableDisableIngestion = jest.fn();
const mockDeployIngestion = jest
  .fn()
  .mockImplementation(() => Promise.resolve());
const mockTriggerIngestion = jest
  .fn()
  .mockImplementation(() => Promise.resolve());

jest.mock('../../../common/SearchBarComponent/SearchBar.component', () => {
  return jest.fn().mockImplementation(() => <div>Searchbar</div>);
});

jest.mock('../../../Modals/EntityDeleteModal/EntityDeleteModal', () => {
  return jest.fn().mockImplementation(() => <div>EntityDeleteModal</div>);
});

jest.mock(
  '../../../Modals/KillIngestionPipelineModal/KillIngestionPipelineModal',
  () => {
    return jest.fn().mockImplementation(() => <div>KillIngestionModal</div>);
  }
);

jest.mock('./AddIngestionButton.component', () => {
  return jest.fn().mockImplementation(() => <div>AddIngestionButton</div>);
});

jest.mock('./IngestionRecentRun/IngestionRecentRuns.component', () => ({
  IngestionRecentRuns: jest
    .fn()
    .mockImplementation(() => <p>IngestionRecentRuns</p>),
}));

jest.mock(
  '../../../common/Skeleton/CommonSkeletons/ControlElements/ControlElements.component',
  () => jest.fn().mockImplementation(() => <div>ButtonSkeleton</div>)
);

jest.mock('../../../../context/PermissionProvider/PermissionProvider', () => ({
  usePermissionProvider: jest.fn().mockReturnValue({
    getEntityPermissionByFqn: jest.fn().mockReturnValue({
      Create: true,
      Delete: true,
      ViewAll: true,
      EditAll: true,
      EditDescription: true,
      EditDisplayName: true,
      EditCustomFields: true,
    }),
  }),
}));

jest.mock('../../../../hooks/useAirflowStatus', () => ({
  useAirflowStatus: jest.fn(() => {
    return {
      isFetchingStatus: false,
      platform: 'airflow',
    };
  }),
}));

jest.mock('../../../../hoc/LimitWrapper', () => {
  return jest
    .fn()
    .mockImplementation(({ children }) => <>LimitWrapper{children}</>);
});

describe('Test Ingestion page', () => {
  it('Page Should render', async () => {
    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const ingestionPageContainer = await findByTestId(
      container,
      'ingestion-container'
    );
    const searchBox = await findByText(container, /Searchbar/i);
    const addIngestionButton = await findByText(
      container,
      'AddIngestionButton'
    );
    const ingestionTable = await findByTestId(container, 'ingestion-table');

    expect(ingestionPageContainer).toBeInTheDocument();
    expect(searchBox).toBeInTheDocument();
    expect(addIngestionButton).toBeInTheDocument();
    expect(ingestionTable).toBeInTheDocument();
  });

  it('Table should render necessary fields', async () => {
    const { findByTestId, findAllByRole } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const ingestionTable = await findByTestId('ingestion-table');
    const tableHeaderContainer = await findAllByRole('columnheader');
    const runButton = await findByTestId('run');
    const editButton = await findByTestId('edit');
    const deleteButton = await findByTestId('delete');
    const killButton = await findByTestId('kill');
    const logsButton = await findByTestId('logs');

    expect(ingestionTable).toBeInTheDocument();
    expect(tableHeaderContainer).toHaveLength(5);
    expect(runButton).toBeInTheDocument();
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    expect(killButton).toBeInTheDocument();
    expect(logsButton).toBeInTheDocument();
  });

  it('Update button should work', async () => {
    const mockPagingAfter = {
      after: 'afterKey',
      before: 'beforeKey',
      total: 0,
    };

    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPagingAfter}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    // on click of edit button
    const editButton = await findByTestId(container, 'edit');
    fireEvent.click(editButton);

    expect(editButton).toBeInTheDocument();
  });

  it('CTA should work', async () => {
    const mockPagingAfter = {
      after: 'afterKey',
      before: 'beforeKey',
      total: 0,
    };

    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPagingAfter}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    // on click of run button

    await act(async () => {
      const runButton = await findByTestId(container, 'run');
      fireEvent.click(runButton);

      expect(mockTriggerIngestion).toHaveBeenCalled();
    });

    // on click of delete button

    const deleteButton = await findByTestId(container, 'delete');
    fireEvent.click(deleteButton);

    expect(
      await findByText(container, /EntityDeleteModal/i)
    ).toBeInTheDocument();

    // on click of add ingestion
    const addIngestionButton = await findByText(
      container,
      'AddIngestionButton'
    );
    fireEvent.click(addIngestionButton);
  });

  it('Airflow DAG view button should be present if endpoint is available', async () => {
    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint="http://localhost"
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const pipelineName = await findByText(container, 'test3_metadata');

    expect(pipelineName).toBeInTheDocument();
  });

  it('Pause button should be present if enabled is available', async () => {
    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint="http://localhost"
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const pauseButton = await findByTestId(container, 'pause');

    expect(pauseButton).toBeInTheDocument();

    fireEvent.click(pauseButton);

    expect(handleEnableDisableIngestion).toHaveBeenCalled();
  });

  it('Unpause button should be present if enabled is false', async () => {
    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint="http://localhost"
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          [
            { ...mockIngestionWorkFlow.data.data, enabled: false },
          ] as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const unpause = await findByTestId(container, 'unpause');
    const run = queryByTestId(container, 'run');

    expect(unpause).toBeInTheDocument();
    expect(run).not.toBeInTheDocument();

    fireEvent.click(unpause);

    expect(handleEnableDisableIngestion).toHaveBeenCalled();
  });

  it('Should render kill modal on click of kill button', async () => {
    const mockPagingAfter = {
      after: 'afterKey',
      before: 'beforeKey',
      total: 0,
    };

    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPagingAfter}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const killButton = await findByTestId(container, 'kill');
    fireEvent.click(killButton);

    expect(
      await findByText(container, /KillIngestionModal/i)
    ).toBeInTheDocument();
  });

  it('should render button skeleton if airflow status is loading', async () => {
    (useAirflowStatus as jest.Mock).mockImplementation(() => ({
      isFetchingStatus: true,
      platform: 'airflow',
    }));

    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const addIngestionButton = queryByText(container, 'AddIngestionButton');

    const loadingButton = getAllByText(container, 'ButtonSkeleton');

    expect(loadingButton).toHaveLength(2);

    expect(addIngestionButton).not.toBeInTheDocument();
  });

  it('should not render add ingestion button if platform is disabled', async () => {
    (useAirflowStatus as jest.Mock).mockImplementation(() => ({
      isFetchingStatus: false,
      platform: 'disabled',
    }));

    const { container } = render(
      <Ingestion
        isRequiredDetailsAvailable
        airflowEndpoint=""
        deleteIngestion={mockDeleteIngestion}
        deployIngestion={mockDeployIngestion}
        handleEnableDisableIngestion={handleEnableDisableIngestion}
        ingestionList={
          mockIngestionWorkFlow.data.data as unknown as IngestionPipeline[]
        }
        paging={mockPaging}
        permissions={mockPermissions}
        serviceCategory={ServiceCategory.DASHBOARD_SERVICES}
        serviceDetails={mockService}
        serviceName=""
        triggerIngestion={mockTriggerIngestion}
        onIngestionWorkflowsUpdate={mockUpdateWorkflows}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const addIngestionButton = queryByText(container, 'AddIngestionButton');

    expect(addIngestionButton).not.toBeInTheDocument();
  });
});
