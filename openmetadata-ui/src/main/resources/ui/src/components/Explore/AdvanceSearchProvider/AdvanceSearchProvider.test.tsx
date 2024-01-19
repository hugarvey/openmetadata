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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import {
  AdvanceSearchProvider,
  useAdvanceSearch,
} from './AdvanceSearchProvider.component';

// jest.mock('qs', () => ({
//   parse: jest.fn().mockReturnValue('{"some":"value"}'),
// }));

// jest.mock('react-awesome-query-builder', () => ({
//   ...jest.requireActual('react-awesome-query-builder'),
//   Utils: {
//     checkTree: jest.fn(),
//     loadTree: jest.fn(),
//     isValidTree: jest.fn().mockReturnValue(true),
//     sqlFormat: jest.fn(),
//   },
// }));

// jest.mock('../../../constants/AdvancedSearch.constants', () => ({
//   emptyJsonTree: {} as Config,
//   getQbConfigs: jest.fn(),
// }));

jest.mock('../AdvanceSearchModal.component', () => ({
  AdvancedSearchModal: jest
    .fn()
    .mockImplementation(({ visible, onSubmit, onCancel }) => (
      <>
        {visible ? (
          <p>AdvanceSearchModal Open</p>
        ) : (
          <p>AdvanceSearchModal Close</p>
        )}
        <button onClick={onSubmit}>Apply Advance Search</button>
        <button onClick={onCancel}>Close Modal</button>
      </>
    )),
}));

jest.mock('../../Loader/Loader', () =>
  jest.fn().mockReturnValue(<div>Loader</div>)
);

const mockPush = jest.fn();

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn().mockReturnValue({
    search: 'queryFilter={"some":"value"}',
  }),
  useParams: jest.fn().mockReturnValue({
    tab: 'tabValue',
  }),
  useHistory: jest.fn().mockImplementation(() => ({
    push: mockPush,
  })),
}));

const Children = () => {
  const { toggleModal } = useAdvanceSearch();

  return (
    <button onClick={() => toggleModal(true)}>Open AdvanceSearch Modal</button>
  );
};

const mockWithAdvanceSearch =
  (Component: React.FC) =>
  (props: JSX.IntrinsicAttributes & { children?: React.ReactNode }) => {
    return (
      <AdvanceSearchProvider>
        <Component {...props} />
      </AdvanceSearchProvider>
    );
  };

const ComponentWithProvider = mockWithAdvanceSearch(Children);

describe('AdvanceSearchProvider component', () => {
  it('should render the AdvanceSearchModal as close by default', () => {
    render(<ComponentWithProvider />);

    expect(screen.getByText('AdvanceSearchModal Close')).toBeInTheDocument();
  });

  it('should call mockPush after submit advance search form', async () => {
    render(<ComponentWithProvider />);

    userEvent.click(screen.getByText('Apply Advance Search'));

    expect(mockPush).toHaveBeenCalled();
  });
});
