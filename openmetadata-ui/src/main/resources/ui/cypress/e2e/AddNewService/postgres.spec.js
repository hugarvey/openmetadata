/*
 *  Copyright 2021 Collate
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
    deleteCreatedService,
    editOwnerforCreatedService,
    goToAddNewServicePage, handleIngestionRetry, interceptURL, scheduleIngestion, testServiceCreationAndIngestion, updateDescriptionForIngestedTables, uuid, verifyResponseStatusCode, visitEntityDetailsPage
} from '../../common/common';
import { API_SERVICE, SERVICE_TYPE } from '../../constants/constants';

const serviceType = 'Postgres';
const serviceName = `${serviceType}-ct-test-${uuid()}`;
const tableName = 'order_items';
const description = `This is ${serviceName} description`;
const filterPattern = 'sales'
const query = 'SELECT * FROM sales.order_items oi INNER JOIN sales.orders o ON oi.order_id=o.order_id'

describe('Postgres Ingestion', () => {
beforeEach(() => {
 cy.login();
});

it('Trigger select query', () => {
  cy.postgreSQL(query);
})

it('add and ingest data', () => {
 goToAddNewServicePage(SERVICE_TYPE.Database);
 const connectionInput = () => {
   cy.get('[id="root_username"]')
   .scrollIntoView()
   .type(Cypress.env('postgresUsername'));
   cy.get('[name="root_password"]')
   .scrollIntoView()
   .type(Cypress.env('postgresPassword'));
   cy.get('[id="root_hostPort"]')
   .scrollIntoView()
   .type(Cypress.env('postgresHostPort'));
   cy.get('#root_database')
   .scrollIntoView()
   .type(Cypress.env('postgresDatabase'));
 };

 const addIngestionInput = () => {
   cy.get('[data-testid="schema-filter-pattern-checkbox"]')
     .scrollIntoView()
     .should('be.visible')
     .check();
     cy.get('[data-testid="filter-pattern-includes-schema"]')
     .scrollIntoView()
     .should('be.visible')
     .type(filterPattern);
 };

 testServiceCreationAndIngestion(
   serviceType,
   connectionInput,
   addIngestionInput,
   serviceName
 );
});

it('Update table description and verify description after re-run', () => {
 updateDescriptionForIngestedTables(
   serviceName,
   tableName,
   description,
   SERVICE_TYPE.Database,
   'tables'
 );
});

it('Add Usage ingestion', () => {
  interceptURL('GET', 'api/v1/teams/name/Organization?fields=*', 'getSettingsPage');
  cy.get('[data-testid="appbar-item-settings"]').should('be.visible').click({ force: true });
  verifyResponseStatusCode('@getSettingsPage', 200);
  // Services page
  interceptURL('GET', '/api/v1/services/*', 'getServices');

  cy.get('[data-testid="settings-left-panel"]')
      .contains(SERVICE_TYPE.Database,)
      .should('be.visible')
      .click();

  verifyResponseStatusCode('@getServices', 200);
  cy.intercept('/api/v1/services/ingestionPipelines?*').as('ingestionData');
  cy.get(`[data-testid="service-name-${serviceName}"]`)
    .should('exist')
    .click();
  cy.get('[data-testid="tabs"]').should('exist');
  cy.wait('@ingestionData');
  cy.get('[data-testid="Ingestions"]')
    .scrollIntoView()
    .should('be.visible')
    .click();
  cy.get('[data-testid="ingestion-details-container"]').should('exist');
  cy.get('[data-testid="add-new-ingestion-button"]')
    .should('be.visible')
    .click();
  cy.get('#menu-item-1')
    .scrollIntoView()
    .contains('Usage Ingestion')
    .click();
  cy.get('[data-testid="next-button"]')
    .scrollIntoView()
    .should('be.visible')
    .click();

  scheduleIngestion();

  // wait for ingestion to run
  cy.clock();
  cy.wait(10000);

  cy.get('[data-testid="view-service-button"]')
    .scrollIntoView()
    .should('be.visible')
    .click();

  handleIngestionRetry('database', true, 0, 'usage');
});

it('Verify if usage is ingested properly',() => {
  visitEntityDetailsPage(tableName, serviceName, 'tables');
  cy.get('[data-testid="Queries"]').should('be.visible').trigger('click');
  //Validate that the triggered query is visible in the queries container
  cy.get('[data-testid="queries-container"]').should('be.visible').should('contain', query);
  //Validate queries count is greater than 1
  cy.get('[data-testid="entity-summary-details"]').invoke('text').should('not.contain', '0 Queries');
  //Validate schema contains frequently joined tables and columns
  cy.get('[data-testid="Schema"]').should('be.visible').click();
  cy.get('[data-testid="related-tables-data"]').should('be.visible');
  cy.get('[data-testid="frequently-joined-columns"]').should('be.visible');
})

it('Edit and validate owner', () => {
 editOwnerforCreatedService(
   SERVICE_TYPE.Database,
   serviceName,
   API_SERVICE.databaseServices
 );
});

it('delete created service', () => {
 deleteCreatedService(SERVICE_TYPE.Database, serviceName, API_SERVICE.databaseServices);
});
});
