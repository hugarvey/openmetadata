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
import { Page, test as base } from '@playwright/test';
import { isUndefined } from 'lodash';
import { ApiEndpointClass } from '../../support/entity/ApiEndpointClass';
import { ContainerClass } from '../../support/entity/ContainerClass';
import { DashboardClass } from '../../support/entity/DashboardClass';
import { DashboardDataModelClass } from '../../support/entity/DashboardDataModelClass';
import { EntityDataClass } from '../../support/entity/EntityDataClass';
import { MlModelClass } from '../../support/entity/MlModelClass';
import { PipelineClass } from '../../support/entity/PipelineClass';
import { SearchIndexClass } from '../../support/entity/SearchIndexClass';
import { StoredProcedureClass } from '../../support/entity/StoredProcedureClass';
import { TableClass } from '../../support/entity/TableClass';
import { TopicClass } from '../../support/entity/TopicClass';
import { UserClass } from '../../support/user/UserClass';
import { performAdminLogin } from '../../utils/admin';
import { redirectToHomePage } from '../../utils/common';

const user = new UserClass();

const entities = [
  ApiEndpointClass,
  TableClass,
  StoredProcedureClass,
  DashboardClass,
  PipelineClass,
  TopicClass,
  MlModelClass,
  ContainerClass,
  SearchIndexClass,
  DashboardDataModelClass,
] as const;

// Create 2 page and authenticate 1 with admin and another with normal user
const test = base.extend<{
  userPage: Page;
}>({
  userPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await user.login(page);
    await use(page);
    await page.close();
  },
});

entities.forEach((EntityClass) => {
  const entity = new EntityClass();

  test.describe(entity.getType(), () => {
    test.beforeAll('Setup pre-requests', async ({ browser }) => {
      const { apiContext, afterAction } = await performAdminLogin(browser);

      await user.create(apiContext);

      const dataStewardRoleResponse = await apiContext.get(
        '/api/v1/roles/name/DataSteward'
      );

      const dataStewardRole = await dataStewardRoleResponse.json();

      await user.patch({
        apiContext,
        patchData: [
          {
            op: 'add',
            path: '/roles/0',
            value: {
              id: dataStewardRole.id,
              type: 'role',
              name: dataStewardRole.name,
            },
          },
        ],
      });

      await EntityDataClass.preRequisitesForTests(apiContext);
      await entity.create(apiContext);
      await afterAction();
    });

    test.beforeEach('Visit entity details page', async ({ userPage }) => {
      await redirectToHomePage(userPage);
      await entity.visitEntityPage(userPage);
    });

    test('User as Owner Add, Update and Remove', async ({ userPage }) => {
      test.slow(true);

      const OWNER1 = EntityDataClass.user1.getUserName();
      const OWNER2 = EntityDataClass.user2.getUserName();
      const OWNER3 = EntityDataClass.user3.getUserName();
      await entity.owner(userPage, [OWNER1, OWNER3], [OWNER2]);
    });

    test('Team as Owner Add, Update and Remove', async ({ userPage }) => {
      const OWNER1 = EntityDataClass.team1.data.displayName;
      const OWNER2 = EntityDataClass.team2.data.displayName;
      await entity.owner(userPage, [OWNER1], [OWNER2], 'Teams');
    });

    test('Tier Add, Update and Remove', async ({ userPage }) => {
      await entity.tier(
        userPage,
        'Tier1',
        EntityDataClass.tierTag1.data.displayName
      );
    });

    test('Update description', async ({ userPage }) => {
      await entity.descriptionUpdate(userPage);
    });

    test('Tag Add, Update and Remove', async ({ userPage }) => {
      await entity.tag(userPage, 'PersonalData.Personal', 'PII.None');
    });

    test('Glossary Term Add, Update and Remove', async ({ userPage }) => {
      await entity.glossaryTerm(
        userPage,
        EntityDataClass.glossaryTerm1.responseData,
        EntityDataClass.glossaryTerm2.responseData
      );
    });

    // Run only if entity has children
    if (!isUndefined(entity.childrenTabId)) {
      test('Tag Add, Update and Remove for child entities', async ({
        userPage,
      }) => {
        await userPage.getByTestId(entity.childrenTabId ?? '').click();

        await entity.tagChildren({
          page: userPage,
          tag1: 'PersonalData.Personal',
          tag2: 'PII.None',
          rowId: entity.childrenSelectorId ?? '',
          rowSelector:
            entity.type === 'MlModel' ? 'data-testid' : 'data-row-key',
        });
      });
    }

    // Run only if entity has children
    if (!isUndefined(entity.childrenTabId)) {
      test('Glossary Term Add, Update and Remove for child entities', async ({
        userPage,
      }) => {
        await userPage.getByTestId(entity.childrenTabId ?? '').click();

        await entity.glossaryTermChildren({
          page: userPage,
          glossaryTerm1: EntityDataClass.glossaryTerm1.responseData,
          glossaryTerm2: EntityDataClass.glossaryTerm2.responseData,
          rowId: entity.childrenSelectorId ?? '',
          rowSelector:
            entity.type === 'MlModel' ? 'data-testid' : 'data-row-key',
        });
      });
    }

    test(`UpVote & DownVote entity`, async ({ userPage }) => {
      await entity.upVote(userPage);
      await entity.downVote(userPage);
    });

    test(`Follow & Un-follow entity`, async ({ userPage }) => {
      const entityName = entity.entityResponseData?.['displayName'];
      await entity.followUnfollowEntity(userPage, entityName);
    });

    test.afterAll('Cleanup', async ({ browser }) => {
      const { apiContext, afterAction } = await performAdminLogin(browser);
      await user.delete(apiContext);
      await entity.delete(apiContext);
      await EntityDataClass.postRequisitesForTests(apiContext);
      await afterAction();
    });
  });
});
