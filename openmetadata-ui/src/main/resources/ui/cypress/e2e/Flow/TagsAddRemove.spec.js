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

// eslint-disable-next-line spaced-comment
/// <reference types="cypress" />

import {
  interceptURL,
  verifyResponseStatusCode,
  visitEntityDetailsPage,
} from '../../common/common';
import { TAGS_ADD_REMOVE_ENTITIES } from '../../constants/tagsAddRemove.constants';

const addTags = (tag) => {
  const tagName = Cypress._.split(tag, '.')[1];

  cy.get('[data-testid="tag-selector"]').scrollIntoView().should('be.visible');
  cy.get('[data-testid="tag-selector"]').click().type(tagName);

  cy.get(`.ant-select-dropdown [data-testid='tag-${tag}']`).click();
  cy.get('[data-testid="tag-selector"] > .ant-select-selector').contains(tag);
};

const checkTags = (tag, checkForParentEntity) => {
  if (checkForParentEntity) {
    cy.get(
      '[data-testid="entity-right-panel"]  [data-testid="tags-container"] [data-testid="entity-tags"] '
    )
      .scrollIntoView()
      .contains(tag);
  } else {
    cy.get(
      '[data-testid="classification-tags-0"]  [data-testid="tags-container"] [data-testid="entity-tags"] '
    )
      .scrollIntoView()
      .contains(tag);
  }
};

const removeTags = (checkForParentEntity) => {
  if (checkForParentEntity) {
    cy.get(
      '[data-testid="entity-right-panel"] [data-testid="tags-container"] [data-testid="edit-button"]'
    )
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[data-testid="remove-tags"]')
      .should('be.visible')
      .click({ multiple: true });

    cy.get('[data-testid="saveAssociatedTag"]')
      .scrollIntoView()
      .should('be.visible')
      .click();
  } else {
    cy.get('[data-testid="classification-tags-0"] [data-testid="edit-button"]')
      .scrollIntoView()
      .trigger('mouseover')
      .click();

    cy.get(`[data-testid="remove-tags"`)
      .should('be.visible')
      .click({ multiple: true });

    cy.get('[data-testid="saveAssociatedTag"]').should('be.visible').click();
  }
  verifyResponseStatusCode('@tagsChange', 200);
};

describe('Check if tags addition and removal flow working properly from tables', () => {
  beforeEach(() => {
    cy.login();
  });

  TAGS_ADD_REMOVE_ENTITIES.map((entityDetails) =>
    it(`Adding and removing tags to the ${entityDetails.entity} entity should work properly`, () => {
      interceptURL(
        'GET',
        `/api/v1/${entityDetails.entity}/name/*?fields=*`,
        'getEntityDetail'
      );
      interceptURL('PATCH', `/api/v1/${entityDetails.entity}/*`, 'tagsChange');
      interceptURL(
        'PATCH',
        `/api/v1/${entityDetails.insideEntity ?? entityDetails.entity}/*`,
        'tagsChange'
      );
      visitEntityDetailsPage(
        entityDetails.term,
        entityDetails.serviceName,
        entityDetails.entity
      );
      verifyResponseStatusCode('@getEntityDetail', 200);

      cy.get(
        '[data-testid="entity-right-panel"] [data-testid="tags-container"]'
      ).then(($container) => {
        if ($container.find('[data-testid="add-tag"]').length === 0) {
          removeTags(true);
        }
        cy.get(
          '[data-testid="entity-right-panel"] [data-testid="tags-container"] [data-testid="add-tag"]'
        ).click();
      });

      addTags(entityDetails.tags[0]);

      cy.get('[data-testid="saveAssociatedTag"]')
        .scrollIntoView()
        .should('be.visible')
        .click();

      verifyResponseStatusCode('@tagsChange', 200);

      checkTags(entityDetails.tags[0], true);

      removeTags(true);

      if (entityDetails.entity === 'mlmodels') {
        cy.get(
          `[data-testid="feature-card-${entityDetails.fieldName}"] [data-testid="classification-tags-0"]`
        ).then(($container) => {
          if ($container.find('[data-testid="add-tag"]').length === 0) {
            removeTags(false);
          }
          cy.get(
            `[data-testid="feature-card-${entityDetails.fieldName}"] [data-testid="classification-tags-0"] [data-testid="add-tag"]`
          ).click();
        });
      } else {
        cy.get(
          '.ant-table-tbody [data-testid="classification-tags-0"] [data-testid="tags-container"]'
        ).then(($container) => {
          if ($container.find('[data-testid="add-tag"]').length === 0) {
            removeTags(false);
          }
          cy.get(
            '.ant-table-tbody [data-testid="classification-tags-0"] [data-testid="tags-container"] [data-testid="add-tag"]'
          ).click();
        });
      }

      entityDetails.tags.map((tag) => addTags(tag));
      cy.clickOutside();

      cy.get('[data-testid="saveAssociatedTag"]')
        .scrollIntoView()
        .should('be.visible')
        .click();

      verifyResponseStatusCode('@tagsChange', 200);

      entityDetails.tags.map((tag) => checkTags(tag));

      removeTags(false, entityDetails.separate);
    })
  );
});
