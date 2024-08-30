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
import { expect, Page, Response, test as base } from '@playwright/test';
import { GLOBAL_SETTING_PERMISSIONS, ID } from '../../constant/common';
import {
  GlobalSettingOptions,
  SETTINGS_OPTIONS_PATH,
  SETTING_CUSTOM_PROPERTIES_PATH,
} from '../../constant/settings';
import { SidebarItem } from '../../constant/sidebar';
import {
  PolicyClass,
  PolicyRulesType,
} from '../../support/access-control/PoliciesClass';
import { RolesClass } from '../../support/access-control/RolesClass';
import { EntityTypeEndpoint } from '../../support/entity/Entity.interface';
import { TableClass } from '../../support/entity/TableClass';
import { TeamClass } from '../../support/team/TeamClass';
import { UserClass } from '../../support/user/UserClass';
import { performAdminLogin } from '../../utils/admin';
import {
  redirectToHomePage,
  uuid,
  visitOwnProfilePage,
} from '../../utils/common';
import { addOwner } from '../../utils/entity';
import { settingClick, sidebarClick } from '../../utils/sidebar';
import {
  addUser,
  checkDataConsumerPermissions,
  checkStewardPermissions,
  checkStewardServicesPermissions,
  generateToken,
  hardDeleteUserProfilePage,
  permanentDeleteUser,
  resetPassword,
  restoreUser,
  restoreUserProfilePage,
  revokeToken,
  softDeleteUser,
  softDeleteUserProfilePage,
  updateExpiration,
  updateUserDetails,
  visitUserListPage,
  visitUserProfilePage,
} from '../../utils/user';

const userName = `pw-user-${uuid()}`;

const updatedUserDetails = {
  name: userName,
  email: `${userName}@gmail.com`,
  updatedDisplayName: `Edited${uuid()}`,
  teamName: 'Applications',
  updatedDescription: `This is updated description ${uuid()}`,
  password: `User@${uuid()}`,
  newPassword: `NewUser@${uuid()}`,
};

const expirationTime = [1, 7, 30, 60, 90];

const id = uuid();

const rules: PolicyRulesType[] = [
  {
    name: 'DataStewardRole',
    resources: ['All'],
    operations: [
      'EditDescription',
      'EditDisplayName',
      'EditLineage',
      'EditOwners',
      'EditTags',
      'ViewAll',
    ],
    effect: 'allow',
  },
];

const adminUser = new UserClass();
const dataConsumerUser = new UserClass();
const dataStewardUser = new UserClass();
const user = new UserClass();
const user2 = new UserClass();
const tableEntity = new TableClass();
const tableEntity2 = new TableClass();

const dataStewardPolicy = new PolicyClass();
const dataStewardRoles = new RolesClass();
let dataStewardTeam: TeamClass;

const test = base.extend<{
  adminPage: Page;
  dataConsumerPage: Page;
  dataStewardPage: Page;
}>({
  adminPage: async ({ browser }, use) => {
    const adminPage = await browser.newPage();
    await adminUser.login(adminPage);
    await use(adminPage);
    await adminPage.close();
  },
  dataConsumerPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await dataConsumerUser.login(page);
    await use(page);
    await page.close();
  },
  dataStewardPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    await dataStewardUser.login(page);
    await use(page);
    await page.close();
  },
});

base.beforeAll('Setup pre-requests', async ({ browser }) => {
  const { apiContext, afterAction } = await performAdminLogin(browser);

  await adminUser.create(apiContext);
  await adminUser.setAdminRole(apiContext);
  await dataConsumerUser.create(apiContext);
  await dataStewardUser.create(apiContext);
  await user.create(apiContext);
  await user2.create(apiContext);
  await tableEntity.create(apiContext);
  await tableEntity2.create(apiContext);

  await dataStewardPolicy.create(apiContext, rules);
  await dataStewardRoles.create(apiContext, [
    dataStewardPolicy.responseData.name,
  ]);
  dataStewardTeam = new TeamClass({
    name: `PW%data_steward_team-${id}`,
    displayName: `PW Data Steward Team ${id}`,
    description: 'playwright Data Steward team description',
    teamType: 'Group',
    users: [dataStewardUser.responseData.id],
    defaultRoles: dataStewardRoles.responseData.id
      ? [dataStewardRoles.responseData.id]
      : [],
  });
  await dataStewardTeam.create(apiContext);

  await afterAction();
});

base.afterAll('Cleanup', async ({ browser }) => {
  const { apiContext, afterAction } = await performAdminLogin(browser);
  //   await adminUser.delete(apiContext);
  await dataConsumerUser.delete(apiContext);
  await dataStewardUser.delete(apiContext);
  await tableEntity.delete(apiContext);
  await tableEntity2.delete(apiContext);

  await dataStewardPolicy.delete(apiContext);
  await dataStewardRoles.delete(apiContext);
  await dataStewardTeam.delete(apiContext);
  await afterAction();
});

test.describe('User with Admin Roles', () => {
  test.slow(true);

  test('Update own admin details', async ({ adminPage }) => {
    await redirectToHomePage(adminPage);

    await updateUserDetails(adminPage, {
      ...updatedUserDetails,
      isAdmin: true,
      role: 'Admin',
    });
  });

  test('Create and Delete user', async ({ adminPage }) => {
    await redirectToHomePage(adminPage);
    await visitUserListPage(adminPage);

    await addUser(adminPage, {
      ...updatedUserDetails,
      role: dataStewardRoles.responseData.displayName,
    });

    await visitUserProfilePage(adminPage, updatedUserDetails.name);

    await visitUserListPage(adminPage);

    await permanentDeleteUser(
      adminPage,
      updatedUserDetails.name,
      updatedUserDetails.name,
      false
    );
  });

  test('Admin soft & hard delete and restore user', async ({ adminPage }) => {
    await redirectToHomePage(adminPage);
    await visitUserListPage(adminPage);
    await softDeleteUser(
      adminPage,
      user2.responseData.name,
      user2.responseData.displayName
    );

    await restoreUser(
      adminPage,
      user2.responseData.name,
      user2.responseData.displayName
    );

    await permanentDeleteUser(
      adminPage,
      user2.responseData.name,
      user2.responseData.displayName
    );
  });

  test('Admin soft & hard delete and restore user from profile page', async ({
    adminPage,
  }) => {
    await redirectToHomePage(adminPage);
    await settingClick(adminPage, GlobalSettingOptions.USERS);
    await softDeleteUserProfilePage(
      adminPage,
      user.responseData.name,
      user.responseData.displayName
    );

    await restoreUserProfilePage(
      adminPage,
      user.responseData.fullyQualifiedName
    );
    await hardDeleteUserProfilePage(adminPage, user.responseData.displayName);
  });
});

test.describe('User with Data Consumer Roles', () => {
  test.slow(true);

  test('Token generation & revocation for Data Consumer', async ({
    dataConsumerPage,
  }) => {
    await redirectToHomePage(dataConsumerPage);
    await visitOwnProfilePage(dataConsumerPage);

    await dataConsumerPage.getByTestId('access-token').click();
    await generateToken(dataConsumerPage);
    await revokeToken(dataConsumerPage);
  });

  test(`Update token expiration for Data Consumer`, async ({
    dataConsumerPage,
  }) => {
    await redirectToHomePage(dataConsumerPage);
    await visitOwnProfilePage(dataConsumerPage);

    await dataConsumerPage.getByTestId('access-token').click();

    await expect(
      dataConsumerPage.locator('[data-testid="no-token"]')
    ).toBeVisible();

    await dataConsumerPage.click('[data-testid="auth-mechanism"] > span');

    for (const expiry of expirationTime) {
      await updateExpiration(dataConsumerPage, expiry);
    }
  });

  test('User should have only view permission for glossary and tags for Data Consumer', async ({
    dataConsumerPage,
  }) => {
    await redirectToHomePage(dataConsumerPage);

    // Check CRUD for Glossary
    await sidebarClick(dataConsumerPage, SidebarItem.GLOSSARY);

    await expect(
      dataConsumerPage.locator('[data-testid="add-glossary"]')
    ).not.toBeVisible();

    await expect(
      dataConsumerPage.locator('[data-testid="add-new-tag-button-header"]')
    ).not.toBeVisible();

    await expect(
      dataConsumerPage.locator('[data-testid="manage-button"]')
    ).not.toBeVisible();

    // Glossary Term Table Action column
    await expect(dataConsumerPage.getByText('Actions')).not.toBeVisible();

    // right panel
    await expect(
      dataConsumerPage.locator('[data-testid="add-domain"]')
    ).not.toBeVisible();
    await expect(
      dataConsumerPage.locator('[data-testid="edit-owner"]')
    ).not.toBeVisible();
    await expect(
      dataConsumerPage.locator('[data-testid="edit-review-button"]')
    ).not.toBeVisible();

    // Check CRUD for Tags
    await sidebarClick(dataConsumerPage, SidebarItem.TAGS);

    await expect(
      dataConsumerPage.locator('[data-testid="add-classification"]')
    ).not.toBeVisible();

    await expect(
      dataConsumerPage.locator('[data-testid="add-new-tag-button"]')
    ).not.toBeVisible();

    await expect(
      dataConsumerPage.locator('[data-testid="manage-button"]')
    ).not.toBeVisible();
  });

  test('Operations for settings page for Data Consumer', async ({
    dataConsumerPage,
  }) => {
    await redirectToHomePage(dataConsumerPage);

    for (const id of Object.values(ID)) {
      let apiResponse: Promise<Response> | undefined;
      if (id?.api) {
        apiResponse = dataConsumerPage.waitForResponse(id.api);
      }
      // Navigate to settings and respective tab page
      await settingClick(dataConsumerPage, id.testid);
      if (id?.api && apiResponse) {
        await apiResponse;
      }

      await expect(
        dataConsumerPage.locator('.ant-skeleton-button')
      ).not.toBeVisible();
      await expect(dataConsumerPage.getByTestId(id.button)).not.toBeVisible();
    }

    for (const id of Object.values(GLOBAL_SETTING_PERMISSIONS)) {
      if (id.testid === GlobalSettingOptions.METADATA) {
        await settingClick(dataConsumerPage, id.testid);
      } else {
        await sidebarClick(dataConsumerPage, SidebarItem.SETTINGS);
        let paths = SETTINGS_OPTIONS_PATH[id.testid];

        if (id.isCustomProperty) {
          paths = SETTING_CUSTOM_PROPERTIES_PATH[id.testid];
        }

        // eslint-disable-next-line jest/no-conditional-expect
        await expect(dataConsumerPage.getByTestId(paths[0])).not.toBeVisible();
      }
    }
  });

  test('Permissions for table details page for Data Consumer', async ({
    adminPage,
    dataConsumerPage,
  }) => {
    await redirectToHomePage(adminPage);

    await tableEntity.visitEntityPage(adminPage);

    await addOwner({
      page: adminPage,
      owner: user.responseData.displayName,
      type: 'Users',
      endpoint: EntityTypeEndpoint.Table,
      dataTestId: 'data-assets-header',
    });

    await tableEntity.visitEntityPage(dataConsumerPage);

    await checkDataConsumerPermissions(dataConsumerPage);
  });

  test('Update user details for Data Consumer', async ({
    dataConsumerPage,
  }) => {
    await redirectToHomePage(dataConsumerPage);

    await updateUserDetails(dataConsumerPage, {
      ...updatedUserDetails,
      isAdmin: false,
    });
  });

  test('Reset Password for Data Consumer', async ({ dataConsumerPage }) => {
    await redirectToHomePage(dataConsumerPage);

    await resetPassword(
      dataConsumerPage,
      dataConsumerUser.data.password,
      updatedUserDetails.password,
      updatedUserDetails.newPassword
    );

    await dataConsumerUser.logout(dataConsumerPage);

    await dataConsumerUser.login(
      dataConsumerPage,
      dataConsumerUser.data.email,
      updatedUserDetails.newPassword
    );

    await visitOwnProfilePage(dataConsumerPage);
  });
});

test.describe('User with Data Steward Roles', () => {
  test.slow(true);

  test('Update user details for Data Steward', async ({ dataStewardPage }) => {
    await redirectToHomePage(dataStewardPage);

    await updateUserDetails(dataStewardPage, {
      ...updatedUserDetails,
      isAdmin: false,
    });
  });

  test('Token generation & revocation for Data Steward', async ({
    dataStewardPage,
  }) => {
    await redirectToHomePage(dataStewardPage);
    await visitOwnProfilePage(dataStewardPage);

    await dataStewardPage.getByTestId('access-token').click();
    await generateToken(dataStewardPage);
    await revokeToken(dataStewardPage);
  });

  test('Update token expiration for Data Steward', async ({
    dataStewardPage,
  }) => {
    await redirectToHomePage(dataStewardPage);
    await visitOwnProfilePage(dataStewardPage);

    await dataStewardPage.getByTestId('access-token').click();

    await expect(
      dataStewardPage.locator('[data-testid="no-token"]')
    ).toBeVisible();

    await dataStewardPage.click('[data-testid="auth-mechanism"] > span');

    for (const expiry of expirationTime) {
      await updateExpiration(dataStewardPage, expiry);
    }
  });

  test('Operations for settings page for Data Steward', async ({
    dataStewardPage,
  }) => {
    await redirectToHomePage(dataStewardPage);

    for (const id of Object.values(ID)) {
      let apiResponse: Promise<Response> | undefined;
      if (id?.api) {
        apiResponse = dataStewardPage.waitForResponse(id.api);
      }
      // Navigate to settings and respective tab page
      await settingClick(dataStewardPage, id.testid);
      if (id?.api && apiResponse) {
        await apiResponse;
      }

      await expect(
        dataStewardPage.locator('.ant-skeleton-button')
      ).not.toBeVisible();
      await expect(dataStewardPage.getByTestId(id.button)).not.toBeVisible();
    }

    for (const id of Object.values(GLOBAL_SETTING_PERMISSIONS)) {
      if (id.testid === GlobalSettingOptions.METADATA) {
        await settingClick(dataStewardPage, id.testid);
      } else {
        await sidebarClick(dataStewardPage, SidebarItem.SETTINGS);
        let paths = SETTINGS_OPTIONS_PATH[id.testid];

        if (id.isCustomProperty) {
          paths = SETTING_CUSTOM_PROPERTIES_PATH[id.testid];
        }

        // eslint-disable-next-line jest/no-conditional-expect
        await expect(dataStewardPage.getByTestId(paths[0])).not.toBeVisible();
      }
    }
  });

  test('Check permissions for Data Steward', async ({
    adminPage,
    dataStewardPage,
  }) => {
    await redirectToHomePage(adminPage);

    await checkStewardServicesPermissions(dataStewardPage);

    await tableEntity2.visitEntityPage(adminPage);

    await addOwner({
      page: adminPage,
      owner: user.responseData.displayName,
      type: 'Users',
      endpoint: EntityTypeEndpoint.Table,
      dataTestId: 'data-assets-header',
    });

    await tableEntity2.visitEntityPage(dataStewardPage);

    await checkStewardPermissions(dataStewardPage);
  });

  test('Reset Password for Data Steward', async ({ dataStewardPage }) => {
    await redirectToHomePage(dataStewardPage);

    await resetPassword(
      dataStewardPage,
      dataStewardUser.data.password,
      updatedUserDetails.password,
      updatedUserDetails.newPassword
    );

    await dataStewardUser.logout(dataStewardPage);

    await dataStewardUser.login(
      dataStewardPage,
      dataStewardUser.data.email,
      updatedUserDetails.newPassword
    );

    await visitOwnProfilePage(dataStewardPage);
  });
});
