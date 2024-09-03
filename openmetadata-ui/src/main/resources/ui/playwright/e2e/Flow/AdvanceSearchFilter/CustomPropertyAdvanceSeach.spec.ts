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
import { expect, test } from '@playwright/test';
import { CUSTOM_PROPERTIES_ENTITIES } from '../../../constant/customProperty';
import { GlobalSettingOptions } from '../../../constant/settings';
import { SidebarItem } from '../../../constant/sidebar';
import { DashboardClass } from '../../../support/entity/DashboardClass';
import { createNewPage, redirectToHomePage, uuid } from '../../../utils/common';
import {
  addCustomPropertiesForEntity,
  deleteCreatedProperty,
} from '../../../utils/customProperty';
import { settingClick, sidebarClick } from '../../../utils/sidebar';

// use the admin user to login
test.use({ storageState: 'playwright/.auth/admin.json' });

const dashboardEntity = new DashboardClass();
const propertyName = `pwCustomPropertyDashboardTest${uuid()}`;
const propertyValue = 'dashboardcustomproperty';

test.beforeAll('Setup pre-requests', async ({ browser }) => {
  const { apiContext, afterAction } = await createNewPage(browser);
  await dashboardEntity.create(apiContext);
  await afterAction();
});

test.afterAll('Cleanup', async ({ browser }) => {
  const { apiContext, afterAction } = await createNewPage(browser);
  await dashboardEntity.delete(apiContext);
  await afterAction();
});

test('CustomProperty Dashboard Filter', async ({ page }) => {
  test.slow(true);

  await redirectToHomePage(page);

  await test.step('Create Dashboard Custom Property', async () => {
    await settingClick(page, GlobalSettingOptions.DASHBOARDS, true);

    await addCustomPropertiesForEntity({
      page,
      propertyName,
      customPropertyData: CUSTOM_PROPERTIES_ENTITIES['entity_dashboard'],
      customType: 'String',
    });
  });

  await test.step('Add Custom Property in Dashboard', async () => {
    await dashboardEntity.visitEntityPage(page);

    await page.getByTestId('custom_properties').click();

    await page
      .getByRole('row', { name: `${propertyName} No data` })
      .locator('svg')
      .click();

    await page.getByTestId('value-input').fill(propertyValue);

    const saveResponse = page.waitForResponse('/api/v1/dashboards/*');

    await page.getByTestId('inline-save-btn').click();

    await saveResponse;

    expect(
      page.getByLabel('Custom Properties').getByTestId('value')
    ).toContainText(propertyValue);
  });

  await test.step(
    'Filter Dashboard using AdvanceSearch Custom Property',
    async () => {
      await redirectToHomePage(page);

      const responseExplorePage = page.waitForResponse(
        '/api/v1/metadata/types/name/storedProcedure?fields=customProperties'
      );

      await sidebarClick(page, SidebarItem.EXPLORE);

      await responseExplorePage;

      const responseCustomPropertyDashboard = page.waitForResponse(
        '/api/v1/metadata/types/name/dashboard?fields=customProperties'
      );

      await page.getByTestId('explore-tree-title-Dashboards').click();

      await responseCustomPropertyDashboard;

      await page.getByTestId('advance-search-button').click();

      await page.waitForSelector('[role="dialog"].ant-modal');

      await expect(page.locator('[role="dialog"].ant-modal')).toBeVisible();

      await expect(page.locator('.ant-modal-title')).toContainText(
        'Advanced Search'
      );

      // Select Custom Property Filter

      await page
        .getByTestId('advanced-search-modal')
        .getByText('Owner')
        .click();

      await page.getByTitle('Custom Properties').click();

      // Select Custom Property Field when we want filter
      await page
        .locator(
          '.group--children .rule--field .ant-select-selector .ant-select-selection-search'
        )
        .click();
      await page.getByTitle(propertyName).click();

      // type custom property value based, on which the filter should be made on dashboard
      await page
        .locator('.group--children .rule--widget .ant-input')
        .fill(propertyValue);

      const applyAdvanceFilter = page.waitForRequest('/api/v1/search/query?*');

      await page.getByTestId('apply-btn').click();

      await applyAdvanceFilter;

      // Validate if filter dashboard appeared

      expect(page.getByTestId('advance-search-filter-text')).toContainText(
        `extension.${propertyName} = '${propertyValue}'`
      );

      expect(page.getByTestId('entity-header-display-name')).toContainText(
        dashboardEntity.entity.displayName
      );
    }
  );

  await test.step('Delete Custom Property ', async () => {
    await settingClick(page, GlobalSettingOptions.DASHBOARDS, true);
    await deleteCreatedProperty(page, propertyName);
  });
});
