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

import { addOwner, removeOwner } from '../../common/advancedSearch';
import { searchAndClickOnOption } from '../../common/advancedSearchQuickFilters';
import { interceptURL, verifyResponseStatusCode } from '../../common/common';
import { QUICK_FILTERS_BY_ASSETS } from '../../constants/advancedSearchQuickFilters.constants';
import { SEARCH_ENTITY_TABLE } from '../../constants/constants';
const ownerName = 'Aaron Johnson';

describe(`Advanced search quick filters should work properly for assets`, () => {
  before(() => {
    cy.login();
    addOwner({ ownerName, ...SEARCH_ENTITY_TABLE.table_1 });
  });

  after(() => {
    cy.login();
    removeOwner();
  });

  beforeEach(() => {
    cy.login();
  });

  it(`should show the quick filters for respective assets`, () => {
    // Navigate to explore page
    cy.sidebarClick('app-bar-item-explore');
    QUICK_FILTERS_BY_ASSETS.map((asset) => {
      cy.get(`[data-testid="${asset.tab}"]`).scrollIntoView().click();

      asset.filters.map((filter) => {
        cy.get(`[data-testid="search-dropdown-${filter.label}"]`)
          .scrollIntoView()
          .should('be.visible');
      });
    });
  });

  it('search dropdown should work properly for tables', () => {
    // Table
    const asset = QUICK_FILTERS_BY_ASSETS[0];

    // Navigate to explore page
    cy.sidebarClick('app-bar-item-explore');
    cy.get(`[data-testid="${asset.tab}"]`).scrollIntoView().click();

    asset.filters
      .filter((item) => item.select)
      .map((filter) => {
        cy.get(`[data-testid="search-dropdown-${filter.label}"]`).click();
        searchAndClickOnOption(asset, filter, true);

        const querySearchURL = `/api/v1/search/query?*index=${
          asset.searchIndex
        }*query_filter=*should*${filter.key}*${encodeURI(
          Cypress._.toLower(filter.selectOption1).replace(' ', '+')
        )}*`;

        interceptURL('GET', querySearchURL, 'querySearchAPI');

        cy.get('[data-testid="update-btn"]').click();

        verifyResponseStatusCode('@querySearchAPI', 200);
      });
  });
});

const openAdvanceSearchModal = (asset) => {
  cy.sidebarClick('app-bar-item-explore');
  cy.get(`[data-testid="${asset.tab}"]`).scrollIntoView().click();

  cy.get('[data-testid="advance-search-button"]').click();
};

const openDropdown = (dropdownSelector) => {
  cy.get(`${dropdownSelector} > .ant-select > .ant-select-selector`)
    .as(dropdownSelector.split('--')[1]) // create alias for field | operator | widget
    .click();
};

/*
    @param virtualListIndex {number} - used to track which virtual list we want to query
            expectedLength {number} - expected options count
*/
const checkDropdownOptionCount = (virtualListIndex, expectedLength) => {
  cy.get('.rc-virtual-list-holder-inner')
    .eq(virtualListIndex)
    .children()
    .should('have.length', expectedLength);
};

const testIsNullAndIsNotNullFilters = (operatorTitle, queryFilter, alias) => {
  const asset = QUICK_FILTERS_BY_ASSETS[0];
  openAdvanceSearchModal(asset);

  // Check Is Null or Is Not Null
  openDropdown('.rule--operator');
  cy.get(`[title="${operatorTitle}"]`).click();

  cy.intercept('GET', '/api/v1/search/query?*', (req) => {
    req.alias = alias;
  }).as(alias);

  cy.get('[data-testid="apply-btn"]').click();

  cy.wait(`@${alias}`).then((xhr) => {
    const actualQueryFilter = JSON.parse(xhr.request.query['query_filter']);

    expect(actualQueryFilter).to.deep.equal(queryFilter);
  });
};

describe(`Advanced Search Modal`, () => {
  beforeEach(() => {
    cy.login();
  });

  it('should check isNull and isNotNull filters', () => {
    // Check Is Null
    const isNullQuery = {
      query: {
        bool: {
          must: [
            {
              bool: {
                must: [
                  {
                    bool: {
                      must_not: {
                        exists: { field: 'owner.displayName.keyword' },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    };
    testIsNullAndIsNotNullFilters('Is null', isNullQuery, 'searchAPI');

    // Check Is Not Null
    const isNotNullQuery = {
      query: {
        bool: {
          must: [
            {
              bool: {
                must: [{ exists: { field: 'owner.displayName.keyword' } }],
              },
            },
          ],
        },
      },
    };
    testIsNullAndIsNotNullFilters(
      'Is not null',
      isNotNullQuery,
      'newSearchAPI'
    );
  });

  it('should filter option for tier properly', () => {
    // table
    const asset = QUICK_FILTERS_BY_ASSETS[0];
    openAdvanceSearchModal(asset);

    // Select Tier Field
    openDropdown('.rule--field');
    cy.get('@field').type('Tier{enter}');

    // Select widget and search
    openDropdown('.widget--widget');

    // virtual list index is 1 because after clicking each select box a new virtual list added in DOM
    // here clicked field select then clicked tier select
    checkDropdownOptionCount(1, 5);

    const TierNameForSearch = 'Tier2';

    cy.get('@widget').type(TierNameForSearch);

    checkDropdownOptionCount(1, 1);

    cy.get('@widget').type('{enter}');
    cy.get('[data-testid="apply-btn"]').click();
  });
});
