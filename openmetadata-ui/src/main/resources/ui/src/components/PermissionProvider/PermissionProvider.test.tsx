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
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  getEntityPermissionByFqn,
  getEntityPermissionById,
  getLoggedInUserPermissions,
  getResourcePermission,
} from '../../rest/permissionAPI';
import PermissionProvider from './PermissionProvider';

jest.mock('../../rest/permissionAPI', () => ({
  getLoggedInUserPermissions: jest
    .fn()
    .mockImplementation(() => Promise.resolve({ data: [] })),
  getEntityPermissionById: jest
    .fn()
    .mockImplementation(() => Promise.resolve({})),
  getEntityPermissionByFqn: jest
    .fn()
    .mockImplementation(() => Promise.resolve({})),
  getResourcePermission: jest
    .fn()
    .mockImplementation(() => Promise.resolve({})),
}));

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn().mockReturnValue({ push: jest.fn(), listen: jest.fn() }),
}));

let currentUser: { id: string; name: string } | null = {
  id: '123',
  name: 'Test User',
};

jest.mock('../authentication/auth-provider/AuthProvider', () => {
  return {
    useAuthContext: jest.fn().mockImplementation(() => ({
      currentUser,
    })),
  };
});

describe('PermissionProvider', () => {
  it('Should render children and call apis when current user is present', async () => {
    render(
      <PermissionProvider>
        <div data-testid="children">Children</div>
      </PermissionProvider>
    );

    // Verify that the API methods were called
    expect(getLoggedInUserPermissions).toHaveBeenCalled();
    expect(getEntityPermissionById).not.toHaveBeenCalled();
    expect(getEntityPermissionByFqn).not.toHaveBeenCalled();
    expect(getResourcePermission).not.toHaveBeenCalled();

    expect(await screen.findByTestId('children')).toBeInTheDocument();
  });

  it('Should not call apis when current user is undefined', async () => {
    currentUser = null;
    render(
      <PermissionProvider>
        <div data-testid="children">Children</div>
      </PermissionProvider>
    );

    // Verify that the API methods were not called
    expect(getLoggedInUserPermissions).not.toHaveBeenCalled();
    expect(getEntityPermissionById).not.toHaveBeenCalled();
    expect(getEntityPermissionByFqn).not.toHaveBeenCalled();
    expect(getResourcePermission).not.toHaveBeenCalled();
  });
});
