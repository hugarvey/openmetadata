/*
 *  Copyright 2024 Collate.
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
import userEvent from '@testing-library/user-event';
import React from 'react';
import { getAllPersonas } from '../../../rest/PersonaAPI';
import { PersonaSelectableList } from './PersonaSelectableList.component';

const personaName = 'personaName';
const data = { id: '1', type: 'user', name: personaName };
const allData = [data, { id: '2', type: 'user', name: 'username1' }];
const fetchOptionsParams = { after: undefined, limit: 50 };
let isSearchValue = false;

const mockUpdate = jest.fn();
const mockFilterFunction = jest.fn();

jest.mock('../../../rest/PersonaAPI', () => ({
  getAllPersonas: jest.fn().mockResolvedValue({
    data: allData,
    paging: { total: 0 },
  }),
}));

jest.mock('../../../utils/EntityUtils', () => ({
  getEntityName: jest.fn().mockReturnValue('personaName'),
  getEntityReferenceListFromEntities: jest.fn().mockReturnValue(allData),
}));

jest.mock('../../common/SelectableList/SelectableList.component', () => ({
  SelectableList: jest
    .fn()
    .mockImplementation(
      ({
        children,
        customTagRenderer,
        searchPlaceholder,
        fetchOptions,
        onUpdate,
      }) => (
        <div data-testid="selectable-list">
          {children}
          {searchPlaceholder}
          {customTagRenderer('tag')}
          <button
            data-testid="fetch-options"
            onClick={() => fetchOptions(isSearchValue ? 'username1' : '')}>
            fetchOptions
          </button>
          <button data-testid="update-button" onClick={() => onUpdate(allData)}>
            Update
          </button>
        </div>
      )
    ),
}));

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),

  Popover: jest.fn().mockImplementation(({ content, children, showArrow }) => {
    return (
      <div data-testid="popover">
        {content}
        {children}
        <button data-testid="show-arrow-button" onClick={() => showArrow(true)}>
          showArrow
        </button>
      </div>
    );
  }),
}));

describe('PersonaSelectableList', () => {
  it('should render Persona Selectable List', () => {
    render(
      <PersonaSelectableList
        hasPermission
        multiSelect={false}
        selectedPersonas={[data]}
        onUpdate={mockUpdate}
      />
    );

    expect(screen.getByTestId('popover')).toBeInTheDocument();
    expect(screen.getByTestId('selectable-list')).toBeInTheDocument();
    expect(screen.getByTestId('add-user')).toBeInTheDocument();
  });

  it('should show the persona list', async () => {
    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission
          multiSelect={false}
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );
    });

    expect(await screen.findByTestId('persona-list-item')).toBeInTheDocument();
    expect(await screen.findByText(personaName)).toBeInTheDocument();
  });

  it('should not render list if hasPermission is false', async () => {
    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission={false}
          multiSelect={false}
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );

      expect(screen.queryByTestId('popover')).not.toBeInTheDocument();
      expect(screen.queryByTestId('selectable-list')).not.toBeInTheDocument();
    });
  });

  it('should call onUpdate function', async () => {
    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission
          multiSelect={false}
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );
      await act(async () => {
        userEvent.click(await screen.findByTestId('update-button'));
      });

      expect(mockUpdate).toHaveBeenCalledWith(data);
    });
  });

  it('should call onUpdate function when multiselect is true', async () => {
    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission
          multiSelect
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );
      await act(async () => {
        userEvent.click(await screen.findByTestId('update-button'));
      });

      expect(mockUpdate).toHaveBeenCalledWith(allData);
    });
  });

  it('should call fetch options', async () => {
    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission
          multiSelect
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );
      await act(async () => {
        userEvent.click(await screen.findByTestId('fetch-options'));
      });

      expect(getAllPersonas as jest.Mock).toHaveBeenCalledWith(
        fetchOptionsParams
      );
    });
  });

  it('should call fetch options when persona list is already present', async () => {
    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission
          multiSelect
          personaList={allData}
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );
      await act(async () => {
        userEvent.click(await screen.findByTestId('fetch-options'));
      });

      expect(await screen.findByText(personaName)).toBeInTheDocument();
    });
  });

  it('should call fetch options when search text is present', async () => {
    isSearchValue = true;

    function filterArray<T>(
      array: T[],
      filterFunction: (value: T) => boolean
    ): T[] {
      return array.filter(filterFunction);
    }

    await act(async () => {
      render(
        <PersonaSelectableList
          hasPermission
          multiSelect
          personaList={allData}
          selectedPersonas={[data]}
          onUpdate={mockUpdate}
        />
      );
      await act(async () => {
        fireEvent.click(await screen.findByTestId('fetch-options'));
      });

      filterArray(allData, mockFilterFunction);

      expect(mockFilterFunction).toHaveBeenCalled();
    });
  });
});
