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

import {
  interceptURL,
  toastNotification,
  verifyResponseStatusCode,
  visitDatabaseSchemaDetailsPage,
} from '../../common/common';
import { hardDeleteService } from '../../common/EntityUtils';
import { getToken } from '../../common/Utils/LocalStorage';
import { addOwner } from '../../common/Utils/Owner';
import { addTier } from '../../common/Utils/Tier';
import { DELETE_TERM } from '../../constants/constants';
import { DOMAIN_CREATION_DETAILS } from '../../constants/EntityConstant';
import { SERVICE_CATEGORIES } from '../../constants/service.constants';
import {
  COMMON_PATCH_PAYLOAD,
  DATABASE_DETAILS_FOR_VERSION_TEST,
  DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST,
  OWNER_DETAILS,
  SERVICE_DETAILS_FOR_VERSION_TEST,
  TIER,
} from '../../constants/Version.constants';

const serviceDetails = SERVICE_DETAILS_FOR_VERSION_TEST.Database;

describe(
  `Database schema version page should work properly`,
  { tags: 'DataAssets' },
  () => {
    const data = {
      user: { id: '', displayName: '' },
      domain: { id: '' },
      database: { id: '' },
      schema: { id: '', fullyQualifiedName: '' },
    };

    before(() => {
      cy.login();
      cy.getAllLocalStorage().then((responseData) => {
        const token = getToken(responseData);

        // Create user
        cy.request({
          method: 'POST',
          url: `/api/v1/users/signup`,
          headers: { Authorization: `Bearer ${token}` },
          body: OWNER_DETAILS,
        }).then((response) => {
          data.user = response.body;
        });

        cy.request({
          method: 'PUT',
          url: `/api/v1/domains`,
          headers: { Authorization: `Bearer ${token}` },
          body: DOMAIN_CREATION_DETAILS,
        }).then((response) => {
          data.domain = response.body;
        });

        // Create service
        cy.request({
          method: 'POST',
          url: `/api/v1/services/${serviceDetails.serviceCategory}`,
          headers: { Authorization: `Bearer ${token}` },
          body: serviceDetails.entityCreationDetails,
        }).then(() => {
          // Create Database
          cy.request({
            method: 'POST',
            url: `/api/v1/databases`,
            headers: { Authorization: `Bearer ${token}` },
            body: DATABASE_DETAILS_FOR_VERSION_TEST,
          }).then((response) => {
            data.database = response.body;

            // Create Database Schema
            cy.request({
              method: 'PUT',
              url: `/api/v1/databaseSchemas`,
              headers: { Authorization: `Bearer ${token}` },
              body: DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST,
            }).then((response) => {
              data.schema = response.body;

              cy.request({
                method: 'PATCH',
                url: `/api/v1/databaseSchemas/${data.schema.id}`,
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json-patch+json',
                },
                body: [
                  ...COMMON_PATCH_PAYLOAD,
                  {
                    op: 'add',
                    path: '/domain',
                    value: {
                      id: data.domain.id,
                      type: 'domain',
                      name: DOMAIN_CREATION_DETAILS.name,
                      description: DOMAIN_CREATION_DETAILS.description,
                    },
                  },
                ],
              });
            });
          });
        });
      });
    });

    after(() => {
      cy.login();
      cy.getAllLocalStorage().then((responseData) => {
        const token = getToken(responseData);
        cy.request({
          method: 'DELETE',
          url: `/api/v1/domains/name/${DOMAIN_CREATION_DETAILS.name}`,
          headers: { Authorization: `Bearer ${token}` },
        });

        // Delete created user
        cy.request({
          method: 'DELETE',
          url: `/api/v1/users/${data.user.id}?hardDelete=true&recursive=false`,
          headers: { Authorization: `Bearer ${token}` },
        });

        hardDeleteService({
          token,
          serviceFqn: serviceDetails.serviceName,
          serviceType: SERVICE_CATEGORIES.DATABASE_SERVICES,
        });
      });
    });

    beforeEach(() => {
      cy.login();
    });

    it(`Database Schema version page should show edited tags and description changes properly`, () => {
      visitDatabaseSchemaDetailsPage({
        settingsMenuId: serviceDetails.settingsMenuId,
        serviceCategory: serviceDetails.serviceCategory,
        serviceName: serviceDetails.serviceName,
        databaseRowKey: data.database.id,
        databaseName: DATABASE_DETAILS_FOR_VERSION_TEST.name,
        databaseSchemaRowKey: data.schema.id,
        databaseSchemaName: DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST.name,
      });

      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/name/${data.schema.fullyQualifiedName}*`,
        `getDatabaseSchemaDetails`
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions`,
        'getVersionsList'
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions/0.2`,
        'getSelectedVersionDetails'
      );

      cy.get('[data-testid="version-button"]').contains('0.2').click();

      verifyResponseStatusCode(`@getDatabaseSchemaDetails`, 200);
      verifyResponseStatusCode('@getVersionsList', 200);
      verifyResponseStatusCode('@getSelectedVersionDetails', 200);

      cy.get(`[data-testid="domain-link"] [data-testid="diff-added"]`)
        .scrollIntoView()
        .should('be.visible');

      cy.get(
        `[data-testid="asset-description-container"] [data-testid="diff-added"]`
      )
        .scrollIntoView()
        .should('be.visible');

      cy.get(
        `[data-testid="entity-right-panel"] .diff-added [data-testid="tag-PersonalData.SpecialCategory"]`
      )
        .scrollIntoView()
        .should('be.visible');

      cy.get(
        `[data-testid="entity-right-panel"] .diff-added [data-testid="tag-PII.Sensitive"]`
      )
        .scrollIntoView()
        .should('be.visible');
    });

    it(`Database Schema version page should show owner changes properly`, () => {
      visitDatabaseSchemaDetailsPage({
        settingsMenuId: serviceDetails.settingsMenuId,
        serviceCategory: serviceDetails.serviceCategory,
        serviceName: serviceDetails.serviceName,
        databaseRowKey: data.database.id,
        databaseName: DATABASE_DETAILS_FOR_VERSION_TEST.name,
        databaseSchemaRowKey: data.schema.id,
        databaseSchemaName: DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST.name,
      });

      cy.get('[data-testid="version-button"]').as('versionButton');

      cy.get('@versionButton').contains('0.2');

      addOwner(data.user.displayName);

      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/name/${data.schema.fullyQualifiedName}*`,
        `getDatabaseSchemaDetails`
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions`,
        'getVersionsList'
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions/0.2`,
        'getSelectedVersionDetails'
      );

      cy.get('@versionButton').contains('0.2').click();

      verifyResponseStatusCode(`@getDatabaseSchemaDetails`, 200);
      verifyResponseStatusCode('@getVersionsList', 200);
      verifyResponseStatusCode('@getSelectedVersionDetails', 200);

      cy.get('[data-testid="owner-link"] > [data-testid="diff-added"]')
        .scrollIntoView()
        .should('be.visible');
    });

    it(`Database Schema version page should show tier changes properly`, () => {
      visitDatabaseSchemaDetailsPage({
        settingsMenuId: serviceDetails.settingsMenuId,
        serviceCategory: serviceDetails.serviceCategory,
        serviceName: serviceDetails.serviceName,
        databaseRowKey: data.database.id,
        databaseName: DATABASE_DETAILS_FOR_VERSION_TEST.name,
        databaseSchemaRowKey: data.schema.id,
        databaseSchemaName: DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST.name,
      });

      cy.get('[data-testid="version-button"]').as('versionButton');

      cy.get('@versionButton').contains('0.2');

      addTier(TIER);

      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/name/${data.schema.fullyQualifiedName}*`,
        `getDatabaseSchemaDetails`
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions`,
        'getVersionsList'
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions/0.2`,
        'getSelectedVersionDetails'
      );

      cy.get('@versionButton').contains('0.2').click();

      verifyResponseStatusCode(`@getDatabaseSchemaDetails`, 200);
      verifyResponseStatusCode('@getVersionsList', 200);
      verifyResponseStatusCode('@getSelectedVersionDetails', 200);

      cy.get('[data-testid="Tier"] > [data-testid="diff-added"]')
        .scrollIntoView()
        .should('be.visible');
    });

    it(`Database  Schema version page should show version details after soft deleted`, () => {
      visitDatabaseSchemaDetailsPage({
        settingsMenuId: serviceDetails.settingsMenuId,
        serviceCategory: serviceDetails.serviceCategory,
        serviceName: serviceDetails.serviceName,
        databaseRowKey: data.database.id,
        databaseName: DATABASE_DETAILS_FOR_VERSION_TEST.name,
        databaseSchemaRowKey: data.schema.id,
        databaseSchemaName: DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST.name,
      });

      // Clicking on permanent delete radio button and checking the service name
      cy.get('[data-testid="manage-button"]').click();

      cy.get('[data-menu-id*="delete-button"]').should('be.visible');
      cy.get('[data-testid="delete-button-title"]').click();

      // Clicking on permanent delete radio button and checking the service name
      cy.get('[data-testid="soft-delete-option"]')
        .contains(DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST.name)
        .click();

      cy.get('[data-testid="confirmation-text-input"]').type(DELETE_TERM);
      interceptURL('DELETE', `/api/v1/databaseSchemas/*`, 'deleteSchema');

      cy.get('[data-testid="confirm-button"]').should('be.visible').click();

      verifyResponseStatusCode('@deleteSchema', 200);

      // Closing the toast notification
      toastNotification(
        `"${DATABASE_SCHEMA_DETAILS_FOR_VERSION_TEST.name}" deleted successfully!`
      );

      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/name/${data.schema.fullyQualifiedName}*`,
        `getDatabaseSchemaDetails`
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions`,
        'getVersionsList'
      );
      interceptURL(
        'GET',
        `/api/v1/databaseSchemas/${data.schema.id}/versions/0.3`,
        'getSelectedVersionDetails'
      );

      cy.get('[data-testid="version-button"]').as('versionButton');

      cy.get('@versionButton').contains('0.3').click();

      verifyResponseStatusCode(`@getDatabaseSchemaDetails`, 200);
      verifyResponseStatusCode('@getVersionsList', 200);
      verifyResponseStatusCode('@getSelectedVersionDetails', 200);

      // Deleted badge should be visible
      cy.get('[data-testid="deleted-badge"]')
        .scrollIntoView()
        .should('be.visible');

      cy.get('@versionButton').click();

      cy.get('[data-testid="manage-button"]')
        .should('exist')
        .should('be.visible')
        .click();

      cy.get('[data-testid="restore-button-title"]').click();

      interceptURL('PUT', `/api/v1/databaseSchemas/restore`, 'restoreSchema');

      cy.get('.ant-modal-footer .ant-btn-primary').contains('Restore').click();

      verifyResponseStatusCode('@restoreSchema', 200);

      toastNotification(`Database Schema restored successfully`);

      cy.get('@versionButton').should('contain', '0.4');
    });
  }
);
