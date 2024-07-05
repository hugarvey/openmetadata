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
import test from '@playwright/test';
import { CUSTOM_PROPERTIES_ENTITIES } from '../../constant/customProperty';
import { redirectToHomePage, uuid } from '../../utils/common';
import {
  addCustomPropertiesForEntity,
  deleteCreatedProperty,
  editCreatedProperty,
} from '../../utils/customProperty';
import { settingClick } from '../../utils/sidebar';

const propertiesList = [
  'Integer',
  'String',
  'Markdown',
  'Duration',
  'Email',
  'Number',
  'Sql Query',
  'Time Interval',
  'Timestamp',
];

// use the admin user to login
test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('Custom properties page', () => {
  test.beforeEach('Visit Home Page', async ({ page }) => {
    await redirectToHomePage(page);
  });

  propertiesList.forEach((property) => {
    test.describe(`Add update and delete ${property} custom properties`, () => {
      Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
        const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

        test(`Add ${property} custom property for ${entity.name}`, async ({
          page,
        }) => {
          test.slow(true);

          await settingClick(page, entity.entityApiType, true);

          await addCustomPropertiesForEntity({
            page,
            propertyName,
            customPropertyData: entity,
            customType: property,
          });

          await editCreatedProperty(page, propertyName);

          await deleteCreatedProperty(page, propertyName);
        });
      });
    });
  });

  test.describe('Add update and delete Enum custom properties', () => {
    Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
      const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

      test(`Add Enum custom property for ${entity.name}`, async ({ page }) => {
        test.slow(true);

        await settingClick(page, entity.entityApiType, true);

        await addCustomPropertiesForEntity({
          page,
          propertyName,
          customPropertyData: entity,
          customType: 'Enum',
          enumConfig: entity.enumConfig,
        });

        await editCreatedProperty(page, propertyName);

        await deleteCreatedProperty(page, propertyName);
      });
    });
  });

  test.describe(
    'Add update and delete Entity Reference custom properties',
    () => {
      Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
        const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

        test(`Add Entity Reference custom property for ${entity.name}`, async ({
          page,
        }) => {
          test.slow(true);

          await settingClick(page, entity.entityApiType, true);

          await addCustomPropertiesForEntity({
            page,
            propertyName,
            customPropertyData: entity,
            customType: 'Entity Reference',
            entityReferenceConfig: entity.entityReferenceConfig,
          });

          await editCreatedProperty(page, propertyName);

          await deleteCreatedProperty(page, propertyName);
        });
      });
    }
  );

  test.describe(
    'Add update and delete Entity Reference List custom properties',
    () => {
      Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
        const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

        test(`Add Entity Reference list custom property for ${entity.name}`, async ({
          page,
        }) => {
          test.slow(true);

          await settingClick(page, entity.entityApiType, true);

          await addCustomPropertiesForEntity({
            page,
            propertyName,
            customPropertyData: entity,
            customType: 'Entity Reference List',
            entityReferenceConfig: entity.entityReferenceConfig,
          });

          await editCreatedProperty(page, propertyName);

          await deleteCreatedProperty(page, propertyName);
        });
      });
    }
  );

  test.describe('Add update and delete Date custom properties', () => {
    Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
      const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

      test(`Add Date custom property for ${entity.name}`, async ({ page }) => {
        test.slow(true);

        await settingClick(page, entity.entityApiType, true);

        await addCustomPropertiesForEntity({
          page,
          propertyName,
          customPropertyData: entity,
          customType: 'Date',
          formatConfig: entity.dateFormatConfig,
        });

        await editCreatedProperty(page, propertyName);

        await deleteCreatedProperty(page, propertyName);
      });
    });
  });

  test.describe('Add update and delete Time custom properties', () => {
    Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
      const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

      test(`Add Time custom property for ${entity.name}`, async ({ page }) => {
        test.slow(true);

        await settingClick(page, entity.entityApiType, true);

        await addCustomPropertiesForEntity({
          page,
          propertyName,
          customPropertyData: entity,
          customType: 'Time',
          formatConfig: entity.timeFormatConfig,
        });

        await editCreatedProperty(page, propertyName);

        await deleteCreatedProperty(page, propertyName);
      });
    });
  });

  test.describe('Add update and delete DateTime custom properties', () => {
    Object.values(CUSTOM_PROPERTIES_ENTITIES).forEach(async (entity) => {
      const propertyName = `pwcustomproperty${entity.name}test${uuid()}`;

      test(`Add DateTime custom property for ${entity.name}`, async ({
        page,
      }) => {
        test.slow(true);

        await settingClick(page, entity.entityApiType, true);

        await addCustomPropertiesForEntity({
          page,
          propertyName,
          customPropertyData: entity,
          customType: 'Date Time',
          formatConfig: entity.dateTimeFormatConfig,
        });

        await editCreatedProperty(page, propertyName);

        await deleteCreatedProperty(page, propertyName);
      });
    });
  });
});
