/*
 *  Copyright 2023 Collate.
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
import { useAuth } from '../../../../../hooks/authHooks';
import { getRoles } from '../../../../../rest/rolesAPIV1';
import { mockUserRole } from '../../mocks/User.mocks';
import UserProfileRoles from './UserProfileRoles.component';
import { UserProfileRolesProps } from './UserProfileRoles.interface';

const mockPropsData: UserProfileRolesProps = {
  userRoles: [],
  updateUserDetails: jest.fn(),
};

jest.mock('../../../../../hooks/authHooks', () => ({
  useAuth: jest.fn().mockReturnValue({ isAdminUser: false }),
}));

jest.mock('../../../../common/InlineEdit/InlineEdit.component', () => {
  return jest.fn().mockImplementation(({ onSave }) => (
    <div data-testid="inline-edit">
      <span>InlineEdit</span>
      <button data-testid="save" onClick={onSave}>
        save
      </button>
    </div>
  ));
});

jest.mock('../../../../common/Chip/Chip.component', () => {
  return jest.fn().mockReturnValue(<p>Chip</p>);
});

jest.mock('../../../../../utils/EntityUtils', () => ({
  getEntityName: jest.fn().mockReturnValue('roleName'),
}));

jest.mock('../../../../../utils/ToastUtils', () => ({
  showErrorToast: jest.fn(),
}));

jest.mock('../../../../../rest/rolesAPIV1', () => ({
  getRoles: jest.fn().mockImplementation(() => Promise.resolve(mockUserRole)),
}));

describe('Test User Profile Roles Component', () => {
  it('should render user profile roles component', async () => {
    render(<UserProfileRoles {...mockPropsData} />);

    expect(screen.getByTestId('user-profile-roles')).toBeInTheDocument();
  });

  it('should render chip component', async () => {
    render(<UserProfileRoles {...mockPropsData} />);

    expect(screen.getByTestId('user-profile-roles')).toBeInTheDocument();

    expect(await screen.findAllByText('Chip')).toHaveLength(1);
  });

  it('should not render roles edit button if non admin user', async () => {
    render(<UserProfileRoles {...mockPropsData} />);

    expect(screen.getByTestId('user-profile-roles')).toBeInTheDocument();

    expect(screen.queryByTestId('edit-roles-button')).not.toBeInTheDocument();
  });

  it('should render edit button if admin user', async () => {
    (useAuth as jest.Mock).mockImplementation(() => ({
      isAdminUser: true,
    }));

    render(<UserProfileRoles {...mockPropsData} />);

    expect(screen.getByTestId('user-profile-roles')).toBeInTheDocument();

    expect(screen.getByTestId('edit-roles-button')).toBeInTheDocument();
  });

  it('should render select field on edit button action', async () => {
    (useAuth as jest.Mock).mockImplementation(() => ({
      isAdminUser: true,
    }));

    render(<UserProfileRoles {...mockPropsData} />);

    expect(screen.getByTestId('user-profile-roles')).toBeInTheDocument();

    const editButton = screen.getByTestId('edit-roles-button');

    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);

    expect(screen.getByText('InlineEdit')).toBeInTheDocument();
  });

  it('should call updateUserDetails on click save', async () => {
    (useAuth as jest.Mock).mockImplementation(() => ({
      isAdminUser: true,
    }));
    render(<UserProfileRoles {...mockPropsData} />);

    fireEvent.click(screen.getByTestId('edit-roles-button'));

    expect(screen.getByText('InlineEdit')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('save'));
    });

    expect(mockPropsData.updateUserDetails).toHaveBeenCalledWith(
      { roles: [], isAdmin: false },
      'roles'
    );
  });

  it('should call roles api on edit button action', async () => {
    (useAuth as jest.Mock).mockImplementation(() => ({
      isAdminUser: true,
    }));

    render(<UserProfileRoles {...mockPropsData} />);

    expect(screen.getByTestId('user-profile-roles')).toBeInTheDocument();

    const editButton = screen.getByTestId('edit-roles-button');

    expect(editButton).toBeInTheDocument();

    fireEvent.click(editButton);

    expect(getRoles).toHaveBeenCalledWith('', undefined, undefined, false, 50);

    expect(screen.getByText('InlineEdit')).toBeInTheDocument();
  });
});
