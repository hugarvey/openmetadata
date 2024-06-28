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
import { EntityTypeEndpoint } from '../support/entity/Entity.interface';
import { toastNotification } from './common';

export enum Services {
  Database = GlobalSettingOptions.DATABASES,
  Messaging = GlobalSettingOptions.MESSAGING,
  Dashboard = GlobalSettingOptions.DASHBOARDS,
  Pipeline = GlobalSettingOptions.PIPELINES,
  MLModels = GlobalSettingOptions.MLMODELS,
  Storage = GlobalSettingOptions.STORAGES,
  Search = GlobalSettingOptions.SEARCH,
}

export const ServicesEntityMap = {
  [Services.Database]: EntityTypeEndpoint.Table,
  [Services.Messaging]: EntityTypeEndpoint.Topic,
  [Services.Dashboard]: EntityTypeEndpoint.Dashboard,
  [Services.Pipeline]: EntityTypeEndpoint.Pipeline,
  [Services.MLModels]: EntityTypeEndpoint.MlModel,
  [Services.Storage]: EntityTypeEndpoint.Container,
  [Services.Search]: EntityTypeEndpoint.SearchIndex,
};

export const getEntityTypeFromService = (service: Services) => {
  switch (service) {
    case Services.Dashboard:
      return EntityTypeEndpoint.DashboardService;
    case Services.Database:
      return EntityTypeEndpoint.DatabaseService;
    case Services.Storage:
      return EntityTypeEndpoint.StorageService;
    case Services.Messaging:
      return EntityTypeEndpoint.MessagingService;
    case Services.Search:
      return EntityTypeEndpoint.SearchService;
    case Services.MLModels:
      return EntityTypeEndpoint.MlModelService;
    case Services.Pipeline:
      return EntityTypeEndpoint.PipelineService;
    default:
      return EntityTypeEndpoint.DatabaseService;
  }
};

export const deleteService = async (
  typeOfService: Services,
  serviceName: string,
  page: Page
) => {
  await page.fill('[data-testid="searchbar"]', serviceName);

  // click on created service
  await page.click(`[data-testid="service-name-${serviceName}"]`);

  const displayName = await page.$eval(
    `[data-testid="entity-header-display-name"]`,
    (element) => element.textContent
  );

  expect(displayName).toBe(serviceName);

  // Clicking on permanent delete radio button and checking the service name
  await page.click('[data-testid="manage-button"]');
  await page.waitForSelector('[data-menu-id*="delete-button"]');
  await page.click('[data-testid="delete-button-title"]');

  // Clicking on permanent delete radio button and checking the service name
  await page.click('[data-testid="hard-delete-option"]');
  await page.click(`[data-testid="hard-delete-option"] >> text=${serviceName}`);

  await page.fill('[data-testid="confirmation-text-input"]', 'DELETE');

  await page.click('[data-testid="confirm-button"]');

  // Closing the toast notification
  await toastNotification(page, `"${serviceName}" deleted successfully!`);

  await page.waitForSelector(`[data-testid="service-name-${serviceName}"]`, {
    state: 'hidden',
  });
};

export const testConnection = async (page: Page) => {
  // Test the connection
  await page.waitForSelector('[data-testid="test-connection-btn"]');

  await page.click('[data-testid="test-connection-btn"]');
  const modalTitle = page.locator(
    '[data-testid="test-connection-modal"] .ant-modal-title'
  );

  await expect(modalTitle).toBeVisible();

  await page.getByRole('button', { name: 'OK' }).click();

  await page.waitForSelector('[data-testid="success-badge"]', {
    state: 'attached',
  });

  await expect(page.getByTestId('messag-text')).toContainText(
    'Connection test was successful.'
  );
};

export const checkServiceFieldSectionHighlighting = async (
  page: Page,
  field: string
) => {
  await page.waitForSelector(`[data-id="${field}"][data-highlighted="true"]`);
};
