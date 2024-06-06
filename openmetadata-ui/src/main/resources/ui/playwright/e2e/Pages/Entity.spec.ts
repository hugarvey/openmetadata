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
import { test } from '@playwright/test';
import { ENTITIES_WITHOUT_FOLLOWING_BUTTON } from '../../constant/delete';
import { ContainerClass } from '../../support/entity/ContainerClass';
import { DashboardClass } from '../../support/entity/DashboardClass';
import { DashboardDataModelClass } from '../../support/entity/DashboardDataModelClass';
import { EntityDataClass } from '../../support/entity/EntityDataClass';
import { MlModelClass } from '../../support/entity/MlModelClass';
import { PipelineClass } from '../../support/entity/PipelineClass';
import { SearchIndexClass } from '../../support/entity/SearchIndexClass';
import { DashboardServiceClass } from '../../support/entity/service/DashboardServiceClass';
import { DatabaseServiceClass } from '../../support/entity/service/DatabaseServiceClass';
import { MessagingServiceClass } from '../../support/entity/service/MessagingServiceClass';
import { MlmodelServiceClass } from '../../support/entity/service/MlmodelServiceClass';
import { PipelineServiceClass } from '../../support/entity/service/PipelineServiceClass';
import { SearchIndexServiceClass } from '../../support/entity/service/SearchIndexServiceClass';
import { StorageServiceClass } from '../../support/entity/service/StorageServiceClass';
import { TableClass } from '../../support/entity/TableClass';
import { TopicClass } from '../../support/entity/TopicClass';
import {
  createNewPage,
  getAuthContext,
  getToken,
  redirectToHomePage,
} from '../../utils/common';

const entities = [
  DatabaseServiceClass,
  DashboardServiceClass,
  MessagingServiceClass,
  MlmodelServiceClass,
  PipelineServiceClass,
  SearchIndexServiceClass,
  StorageServiceClass,
  TableClass,
  DashboardClass,
  PipelineClass,
  TopicClass,
  MlModelClass,
  ContainerClass,
  SearchIndexClass,
  DashboardDataModelClass,
] as const;

// use the admin user to login
test.use({ storageState: 'playwright/.auth/admin.json' });

entities.forEach((EntityClass) => {
  const entity = new EntityClass();
  const deleteEntity = new EntityClass();
  const allowFollowUnfollowTest = !ENTITIES_WITHOUT_FOLLOWING_BUTTON.includes(
    entity.endpoint
  );

  test.describe(entity.getType(), () => {
    test.beforeAll('Setup pre-requests', async ({ browser }) => {
      const { apiContext, afterAction } = await createNewPage(browser);

      await EntityDataClass.preRequisitesForTests(apiContext);
      await entity.create(apiContext);
      await afterAction();
    });

    test.beforeEach('Visit entity details page', async ({ page }) => {
      await redirectToHomePage(page);
      await entity.visitEntityPage(page);
    });

    test('Domain Add, Update and Remove', async ({ page }) => {
      await entity.domain(
        page,
        EntityDataClass.domain1.responseData,
        EntityDataClass.domain2.responseData
      );
    });

    test('User as Owner Add, Update and Remove', async ({ page }) => {
      const OWNER1 = EntityDataClass.user1.getUserName();
      const OWNER2 = EntityDataClass.user2.getUserName();
      await entity.owner(page, OWNER1, OWNER2);
    });

    test('Team as Owner Add, Update and Remove', async ({ page }) => {
      const OWNER1 = EntityDataClass.team1.data.displayName;
      const OWNER2 = EntityDataClass.team2.data.displayName;
      await entity.owner(page, OWNER1, OWNER2, 'Teams');
    });

    test('Tier Add, Update and Remove', async ({ page }) => {
      await entity.tier(page, 'Tier1', 'Tier5');
    });

    test('Update description', async ({ page }) => {
      await entity.descriptionUpdate(page);
    });

    test('Tag Add, Update and Remove', async ({ page }) => {
      await entity.tag(page, 'PersonalData.Personal', 'PII.None');
    });

    test('Glossary Term Add, Update and Remove', async ({ page }) => {
      await entity.glossaryTerm(
        page,
        EntityDataClass.glossaryTerm1.responseData,
        EntityDataClass.glossaryTerm2.responseData
      );
    });

    test(`Announcement create & delete`, async ({ page }) => {
      await entity.announcement(
        page,
        entity.entityResponseData?.['fullyQualifiedName']
      );
    });

    test(`Inactive Announcement create & delete`, async ({ page }) => {
      await entity.inactiveAnnouncement(page);
    });

    if (allowFollowUnfollowTest) {
      test(`UpVote & DownVote entity`, async ({ page }) => {
        await entity.upVote(page);
        await entity.downVote(page);
      });

      test(`Follow & Un-follow entity`, async ({ page }) => {
        const entityName = entity.entityResponseData?.['displayName'];
        await entity.followUnfollowEntity(page, entityName);
      });
    }

    test(`Update displayName`, async ({ page }) => {
      await entity.renameEntity(page, entity.entity.name);
    });

    test.afterAll('Cleanup', async ({ browser }) => {
      const { apiContext, afterAction } = await createNewPage(browser);
      await entity.delete(apiContext);
      await EntityDataClass.postRequisitesForTests(apiContext);
      await afterAction();
    });
  });

  test(`Delete ${deleteEntity.getType()}`, async ({ page }) => {
    await redirectToHomePage(page);
    // get the token from localStorage
    const token = await getToken(page);

    // create a new context with the token
    const apiContext = await getAuthContext(token);
    await deleteEntity.create(apiContext);
    await redirectToHomePage(page);
    await deleteEntity.visitEntityPage(page);

    await test.step('Soft delete', async () => {
      await deleteEntity.softDeleteEntity(
        page,
        deleteEntity.entity.name,
        deleteEntity.entityResponseData?.['displayName']
      );
    });

    await test.step('Hard delete', async () => {
      await deleteEntity.hardDeleteEntity(
        page,
        deleteEntity.entity.name,
        deleteEntity.entityResponseData?.['displayName']
      );
    });
  });
});
