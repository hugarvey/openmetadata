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

import test, { expect } from '@playwright/test';
import { GlobalSettingOptions } from '../../constant/settings';
import {
  clickOutside,
  createNewPage,
  descriptionBox,
  generateRandomUsername,
  redirectToHomePage,
  uuid,
} from '../../utils/common';
import { settingClick } from '../../utils/sidebar';

const roleName = `Role-test-${uuid()}`;
const user = generateRandomUsername();
const userDisplayName = user.firstName + ' ' + user.lastName;
const userName = user.email.split('@')[0].toLowerCase();

// use the admin user to login
test.use({ storageState: 'playwright/.auth/admin.json', trace: 'off' });

test.describe.serial('Add role and assign it to the user', () => {
  test.beforeEach(async ({ page }) => {
    await redirectToHomePage(page);
  });

  test.afterAll('cleanup', async ({ browser }) => {
    const { apiContext, afterAction } = await createNewPage(browser);

    await apiContext.delete(`/api/v1/roles/name/${roleName}`);
    await apiContext.delete(`/api/v1/users/name/${userName}`);

    await afterAction();
  });

  test('Create role', async ({ page }) => {
    await settingClick(page, GlobalSettingOptions.ROLES);

    await page.click('[data-testid="add-role"]');

    await page.fill('[data-testid="name"]', roleName);
    await page.fill(descriptionBox, `description for ${roleName}`);

    await page.click('[data-testid="policies"]');
    await page.click('[title="Data Consumer Policy"]');
    await page.click('[title="Data Steward Policy"]');

    const policyResponse = page.waitForResponse(`/api/v1/roles`);

    await page.click('[data-testid="submit-btn"]');
    await policyResponse;

    await page.waitForURL(`**/settings/access/roles/${roleName}`);

    await page.waitForSelector('[data-testid="inactive-link"]');

    expect(await page.textContent('[data-testid="inactive-link"]')).toBe(
      roleName
    );
    expect(
      await page.textContent(
        '[data-testid="asset-description-container"] [data-testid="viewer-container"]'
      )
    ).toContain(`description for ${roleName}`);
  });

  test('Create new user and assign new role to him', async ({ page }) => {
    await settingClick(page, GlobalSettingOptions.USERS);

    await page.click('[data-testid="add-user"]');

    await page.fill('[data-testid="email"]', user.email);
    await page.fill('[data-testid="displayName"]', userDisplayName);
    await page.fill(descriptionBox, 'Adding user');
    await page.click('[data-testid="password-generator"]');

    await page.click('[data-testid="roles-dropdown"]');
    await page.fill('#roles', roleName);
    await page.click(`[title="${roleName}"]`);

    await clickOutside(page);
    const userResponse = page.waitForResponse(`/api/v1/users`);
    await page.click('[data-testid="save-user"]');

    await userResponse;
  });

  test('Verify assigned role to new user', async ({ page }) => {
    await settingClick(page, GlobalSettingOptions.USERS);

    const searchUser = page.waitForResponse(
      `/api/v1/search/query?q=*${encodeURIComponent(userDisplayName)}*`
    );
    await page.waitForSelector('[data-testid="searchbar"]');
    await page.fill('[data-testid="searchbar"]', userDisplayName);

    await searchUser;
    await page.waitForSelector(`[data-testid="${userName}"]`);
    await page.click(`[data-testid="${userName}"]`);
    await page.waitForSelector('[data-testid="user-profile"]');
    await page.click(
      '[data-testid="user-profile"] .ant-collapse-expand-icon > .anticon'
    );

    expect(
      await page.textContent(
        '[data-testid="user-profile"] [data-testid="user-profile-roles"]'
      )
    ).toContain(roleName);
  });
});
