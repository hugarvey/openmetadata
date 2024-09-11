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
import { expect, Page } from '@playwright/test';
import { GlobalSettingOptions } from '../constant/settings';
import { toastNotification, visitOwnProfilePage } from './common';
import { settingClick } from './sidebar';

export const navigateToCustomizeLandingPage = async (
  page: Page,
  { personaName, customPageDataResponse }
) => {
  const getPersonas = page.waitForResponse('/api/v1/personas*');

  await settingClick(page, GlobalSettingOptions.CUSTOMIZE_LANDING_PAGE);

  await getPersonas;

  const getCustomPageDataResponse = page.waitForResponse(
    `/api/v1/docStore/name/persona.${encodeURIComponent(
      personaName
    )}.Page.LandingPage`
  );

  // Navigate to the customize landing page
  await page.click(
    `[data-testid="persona-details-card-${personaName}"] [data-testid="customize-page-button"]`
  );
  //   getByTestId('persona-details-card-PW%Persona-0e0cb753').getByTestId('customize-page-button')

  expect((await getCustomPageDataResponse).status()).toBe(
    customPageDataResponse
  );
};

export const removeAndCheckWidget = async (
  page: Page,
  { widgetTestId, widgetKey }
) => {
  // Click on remove widget button
  await page.click(
    `[data-testid="${widgetTestId}"] [data-testid="remove-widget-button"]`
  );

  // Check if widget does not exist
  await page.waitForSelector(`[data-testid="${widgetTestId}"]`, {
    state: 'detached',
  });

  // Check if empty widget placeholder is displayed in place of removed widget
  await page.waitForSelector(
    `[data-testid*="${widgetKey}"][data-testid$="EmptyWidgetPlaceholder"]`
  );

  // Remove empty widget placeholder
  await page.click(
    `[data-testid*="${widgetKey}"][data-testid$="EmptyWidgetPlaceholder"] [data-testid="remove-widget-button"]`
  );

  // Check if empty widget placeholder does not exist
  await page.waitForSelector(
    `[data-testid*="${widgetKey}"][data-testid$="EmptyWidgetPlaceholder"]`,
    { state: 'detached' }
  );
};

export const checkAllDefaultWidgets = async (
  page: Page,
  checkEmptyWidgetPlaceholder = false
) => {
  await expect(page.getByTestId('activity-feed-widget')).toBeVisible();
  await expect(page.getByTestId('following-widget')).toBeVisible();
  await expect(page.getByTestId('recently-viewed-widget')).toBeVisible();
  await expect(page.getByTestId('data-assets-widget')).toBeVisible();
  await expect(page.getByTestId('my-data-widget')).toBeVisible();
  await expect(page.getByTestId('kpi-widget')).toBeVisible();
  await expect(page.getByTestId('total-assets-widget')).toBeVisible();

  if (checkEmptyWidgetPlaceholder) {
    await expect(
      page.getByTestId('ExtraWidget.EmptyWidgetPlaceholder')
    ).toBeVisible();
  }
};

export const setUserDefaultPersona = async (
  page: Page,
  personaName: string
) => {
  await visitOwnProfilePage(page);

  await page
    .locator(
      '[data-testid="user-profile-details"] [data-testid="edit-persona"]'
    )
    .click();

  await page.waitForSelector(
    '[role="tooltip"] [data-testid="selectable-list"]'
  );

  const setDefaultPersona = page.waitForResponse('/api/v1/users/*');

  await page.getByTitle(personaName).click();

  await setDefaultPersona;

  await expect(
    page.locator('[data-testid="user-profile-details"]')
  ).toContainText(personaName);
};

export const openAddWidgetModal = async (page: Page) => {
  const fetchResponse = page.waitForResponse(
    '/api/v1/docStore?fqnPrefix=KnowledgePanel*'
  );
  await page
    .locator(
      '[data-testid="ExtraWidget.EmptyWidgetPlaceholder"] [data-testid="add-widget-button"]'
    )
    .click();

  await fetchResponse;
};

export const navigateToLandingPage = async (page: Page) => {
  const feedResponse = page.waitForResponse(`/api/v1/feed*`);
  const dataInsightResponse = page.waitForResponse(
    `/api/v1/analytics/dataInsights/system/charts/name/total_data_assets/data?*`
  );

  // Click on the logo to navigate to the landing page
  await page.locator('#openmetadata_logo').click();

  await feedResponse;
  await dataInsightResponse;
};

export const saveLayout = async (page: Page) => {
  const saveResponse = page.waitForResponse('/api/v1/docStore/*');
  await page.locator('[data-testid="save-button"]').click();
  await saveResponse;

  await toastNotification(page, 'Page layout updated successfully.');
};
