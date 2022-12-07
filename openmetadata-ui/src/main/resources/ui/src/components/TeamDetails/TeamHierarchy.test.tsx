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

import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CURRENT_TEAM_MOCK_DATA, TABLE_MOCK_DATA } from './mockTeamData';
import { TeamHierarchyProps } from './team.interface';
import TeamHierarchy from './TeamHierarchy';

const teamHierarchyPropsData: TeamHierarchyProps = {
  data: TABLE_MOCK_DATA,
  currentTeam: CURRENT_TEAM_MOCK_DATA,
  onTeamExpand: jest.fn(),
};

const mockShowErrorToast = jest.fn();

// mock library imports
jest.mock('react-router-dom', () => ({
  Link: jest
    .fn()
    .mockImplementation(({ children }) => <a href="#">{children}</a>),
}));

jest.mock('../../utils/TeamUtils', () => ({
  getMovedTeamData: jest.fn().mockReturnValue([]),
}));

jest.mock('../../axiosAPIs/teamsAPI', () => ({
  changeTeamParent: jest
    .fn()
    .mockImplementation(() => Promise.resolve(CURRENT_TEAM_MOCK_DATA)),
  getTeamByName: jest
    .fn()
    .mockImplementation(() => Promise.resolve(CURRENT_TEAM_MOCK_DATA)),
}));

jest.mock('../../utils/CommonUtils', () => ({
  getEntityName: jest.fn().mockReturnValue('entityName'),
}));

jest.mock('../../utils/RouterUtils', () => ({
  getTeamsWithFqnPath: jest.fn().mockReturnValue([]),
}));

jest.mock('../../utils/ToastUtils', () => ({
  showErrorToast: jest.fn().mockImplementation(() => mockShowErrorToast),
}));

jest.mock('../../utils/SvgUtils', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue(<p data-testid="svg-icon">SVGIcons</p>),
    Icons: {
      DRAG: 'drag',
      ARROW_DOWN_LIGHT: 'arrow-down-light',
      ARROW_RIGHT_LIGHT: 'arrow-right-light',
    },
  };
});

describe('Team Hierarchy page', () => {
  it('Initially, Table should load', async () => {
    await act(async () => {
      render(<TeamHierarchy {...teamHierarchyPropsData} />, {
        wrapper: MemoryRouter,
      });
    });

    const table = await screen.findByTestId('team-hierarchy-table');

    expect(table).toBeInTheDocument();
  });

  it('Should render all table columns', async () => {
    await act(async () => {
      render(<TeamHierarchy {...teamHierarchyPropsData} />, {
        wrapper: MemoryRouter,
      });
    });

    const table = await screen.findByTestId('team-hierarchy-table');
    const teamsColumn = await screen.findByText('Teams');
    const typeColumn = await screen.findByText('Type');
    const subTeamsColumn = await screen.findByText('Sub Teams');
    const usersColumn = await screen.findByText('Users');
    const assetCountColumn = await screen.findByText('Asset Count');
    const descriptionColumn = await screen.findByText('Description');
    const rows = await screen.findAllByRole('row');

    expect(table).toBeInTheDocument();
    expect(teamsColumn).toBeInTheDocument();
    expect(typeColumn).toBeInTheDocument();
    expect(subTeamsColumn).toBeInTheDocument();
    expect(usersColumn).toBeInTheDocument();
    expect(assetCountColumn).toBeInTheDocument();
    expect(descriptionColumn).toBeInTheDocument();

    expect(rows).toHaveLength(TABLE_MOCK_DATA.length + 1);
  });

  it('Should render child row in table', async () => {
    await act(async () => {
      render(<TeamHierarchy {...teamHierarchyPropsData} />, {
        wrapper: MemoryRouter,
      });
    });

    const table = await screen.findByTestId('team-hierarchy-table');

    expect(table).toBeInTheDocument();

    const expandableTableRow = await screen.getAllByTestId('expand-table-row');
    fireEvent.click(expandableTableRow[0]);

    const totalRows = await screen.findAllByText('entityName');

    expect(totalRows).toHaveLength(5);
  });
});
