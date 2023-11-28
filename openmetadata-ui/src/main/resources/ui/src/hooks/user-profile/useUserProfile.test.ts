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
import { renderHook } from '@testing-library/react-hooks';
import { useUserProfile } from './useUserProfile';

jest.mock(
  '../../components/ApplicationConfigProvider/ApplicationConfigProvider',
  () => ({
    useApplicationConfigContext: jest.fn().mockImplementation(() => ({
      userProfilePics: {
        chirag: {},
      },
      updateUserProfilePics: jest.fn(),
    })),
  })
);

describe('useUserProfile hook', () => {
  it('useUserProfile should not hit API if permission is not granted', () => {
    const { result } = renderHook(() =>
      useUserProfile({ permission: false, name: '' })
    );

    expect(result.current[0]).toBeNull();
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeUndefined();
  });
});
