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
import { expect, Locator, Page } from '@playwright/test';
import { clickOutside } from './common';

type EntityFields = {
  id: string;
  name: string;
  localSearch: boolean;
};

export const FIELDS: EntityFields[] = [
  {
    id: 'Owner',
    name: 'owners.displayName.keyword',
    localSearch: false,
  },
  {
    id: 'Tags',
    name: 'tags.tagFQN',
    localSearch: false,
  },
  {
    id: 'Tier',
    name: 'tier.tagFQN',
    localSearch: true,
  },
  {
    id: 'Service',
    name: 'service.displayName.keyword',
    localSearch: false,
  },
  {
    id: 'Database',
    name: 'database.displayName.keyword',
    localSearch: false,
  },
  {
    id: 'Database Schema',
    name: 'databaseSchema.displayName.keyword',
    localSearch: false,
  },
  {
    id: 'Column',
    name: 'columns.name.keyword',
    localSearch: false,
  },
];

export const OPERATOR = {
  AND: {
    name: 'AND',
    index: 1,
  },
  OR: {
    name: 'OR',
    index: 2,
  },
};

export const CONDITIONS_MUST = {
  equalTo: {
    name: '==',
    filter: 'must',
  },
  contains: {
    name: 'Contains',
    filter: 'must',
  },
  anyIn: {
    name: 'Any in',
    filter: 'must',
  },
};

export const CONDITIONS_MUST_NOT = {
  notEqualTo: {
    name: '!=',
    filter: 'must_not',
  },
  notIn: {
    name: 'Not in',
    filter: 'must_not',
  },
  notContains: {
    name: 'Not contains',
    filter: 'must_not',
  },
};

export const NULL_CONDITIONS = {
  isNull: {
    name: 'Is null',
    filter: 'empty',
  },
  isNotNull: {
    name: 'Is not null',
    filter: 'empty',
  },
};

export const showAdvancedSearchDialog = async (page: Page) => {
  await page.getByTestId('advance-search-button').click();

  await expect(page.locator('[role="dialog"].ant-modal')).toBeVisible();
};

const selectOption = async (
  page: Page,
  dropdownLocator: Locator,
  optionTitle: string
) => {
  await dropdownLocator.click();
  await page.click(`.ant-select-dropdown:visible [title="${optionTitle}"]`);
};

export const fillRule = async (
  page: Page,
  {
    condition,
    field,
    searchCriteria,
    index,
  }: {
    condition: string;
    field: EntityFields;
    searchCriteria: string;
    index: number;
  }
) => {
  const ruleLocator = page.locator('.rule').nth(index - 1);

  // Perform click on rule field
  await selectOption(
    page,
    ruleLocator.locator('.rule--field .ant-select'),
    field.id
  );

  // Perform click on operator
  await selectOption(
    page,
    ruleLocator.locator('.rule--operator .ant-select'),
    condition
  );

  if (searchCriteria) {
    const inputElement = ruleLocator.locator(
      '.rule--widget--TEXT input[type="text"]'
    );
    const searchData = field.localSearch
      ? searchCriteria
      : searchCriteria.toLowerCase();

    if (await inputElement.isVisible()) {
      await inputElement.fill(searchData);
    } else {
      const dropdownInput = ruleLocator.locator(
        '.widget--widget > .ant-select > .ant-select-selector input'
      );
      let aggregateRes;

      if (!field.localSearch) {
        aggregateRes = page.waitForResponse('/api/v1/search/aggregate?*');
      }

      await dropdownInput.click();
      await dropdownInput.fill(searchData);

      if (aggregateRes) {
        await aggregateRes;
      }

      await page
        .locator(`.ant-select-dropdown:visible [title="${searchData}"]`)
        .click();
    }

    await clickOutside(page);
  }
};

export const checkMustPaths = async (
  page: Page,
  { condition, field, searchCriteria, index }
) => {
  const searchData = field.localSearch
    ? searchCriteria
    : searchCriteria.toLowerCase();

  await fillRule(page, {
    condition,
    field,
    searchCriteria,
    index,
  });

  const searchRes = page.waitForResponse(
    '/api/v1/search/query?*index=dataAsset&from=0&size=10*'
  );
  await page.getByTestId('apply-btn').click();
  await searchRes.then(async (res) => {
    await expect(res.request().url()).toContain(encodeURI(searchData));

    await res.json().then(async (json) => {
      await expect(JSON.stringify(json.hits.hits)).toContain(searchCriteria);
    });
  });

  await expect(
    page.getByTestId('advance-search-filter-container')
  ).toContainText(searchData);
};

export const checkMustNotPaths = async (
  page: Page,
  { condition, field, searchCriteria, index }
) => {
  const searchData = field.localSearch
    ? searchCriteria
    : searchCriteria.toLowerCase();

  await fillRule(page, {
    condition,
    field,
    searchCriteria,
    index,
  });

  const searchRes = page.waitForResponse(
    '/api/v1/search/query?*index=dataAsset&from=0&size=10*'
  );
  await page.getByTestId('apply-btn').click();
  await searchRes.then(async (res) => {
    await expect(res.request().url()).toContain(encodeURI(searchData));

    if (!['columns.name.keyword'].includes(field.name)) {
      await res.json().then(async (json) => {
        await expect(JSON.stringify(json.hits.hits)).not.toContain(
          searchCriteria
        );
      });
    }
  });

  await expect(
    page.getByTestId('advance-search-filter-container')
  ).toContainText(searchData);
};

export const checkNullPaths = async (
  page: Page,
  { condition, field, searchCriteria, index }
) => {
  await fillRule(page, {
    condition,
    field,
    searchCriteria,
    index,
  });

  const searchRes = page.waitForResponse(
    '/api/v1/search/query?*index=dataAsset&from=0&size=10*'
  );
  await page.getByTestId('apply-btn').click();
  await searchRes.then(async (res) => {
    const urlParams = new URLSearchParams(res.request().url());
    const queryFilter = JSON.parse(urlParams.get('query_filter') ?? '');

    const resultQuery =
      condition === 'Is null'
        ? {
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      must: [
                        {
                          bool: {
                            must_not: {
                              exists: { field: field.name },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          }
        : {
            query: {
              bool: {
                must: [
                  {
                    bool: {
                      must: [{ exists: { field: field.name } }],
                    },
                  },
                ],
              },
            },
          };

    await expect(JSON.stringify(queryFilter)).toContain(
      JSON.stringify(resultQuery)
    );
  });
};

export const verifyAllConditions = async (
  page: Page,
  field: EntityFields,
  searchCriteria: string
) => {
  // Check for Must conditions
  for (const condition of Object.values(CONDITIONS_MUST)) {
    await showAdvancedSearchDialog(page);
    await checkMustPaths(page, {
      condition: condition.name,
      field,
      searchCriteria: searchCriteria,
      index: 1,
    });
    await page.getByTestId('clear-filters').click();
  }

  // Check for Must Not conditions
  for (const condition of Object.values(CONDITIONS_MUST_NOT)) {
    await showAdvancedSearchDialog(page);
    await checkMustNotPaths(page, {
      condition: condition.name,
      field,
      searchCriteria: searchCriteria,
      index: 1,
    });
    await page.getByTestId('clear-filters').click();
  }

  // Check for Null and Not Null conditions
  for (const condition of Object.values(NULL_CONDITIONS)) {
    await showAdvancedSearchDialog(page);
    await checkNullPaths(page, {
      condition: condition.name,
      field,
      searchCriteria: undefined,
      index: 1,
    });
    await page.getByTestId('clear-filters').click();
  }
};

export const checkAddRuleOrGroupWithOperator = async (
  page,
  {
    field,
    operator,
    condition1,
    condition2,
    searchCriteria1,
    searchCriteria2,
  }: {
    field: EntityFields;
    operator: string;
    condition1: string;
    condition2: string;
    searchCriteria1: string;
    searchCriteria2: string;
  },
  isGroupTest = false
) => {
  await showAdvancedSearchDialog(page);
  await fillRule(page, {
    condition: condition1,
    field,
    searchCriteria: searchCriteria1,
    index: 1,
  });

  if (!isGroupTest) {
    await page.getByTestId('advanced-search-add-rule').nth(1).click();
  } else {
    await page.getByTestId('advanced-search-add-group').first().click();
  }

  await fillRule(page, {
    condition: condition2,
    field,
    searchCriteria: searchCriteria2,
    index: 2,
  });

  if (operator === 'OR') {
    await page
      .getByTestId('advanced-search-modal')
      .getByRole('button', { name: 'Or' });
  }

  const searchRes = page.waitForResponse(
    '/api/v1/search/query?*index=dataAsset&from=0&size=10*'
  );
  await page.getByTestId('apply-btn').click();
  await searchRes;
  await searchRes.then(async (res) => {
    await res.json().then(async (json) => {
      if (field.id !== 'Column') {
        if (operator === 'Or') {
          await expect(JSON.stringify(json)).toContain(searchCriteria1);
          await expect(JSON.stringify(json)).toContain(searchCriteria2);
        } else {
          await expect(JSON.stringify(json)).toContain(searchCriteria1);
          await expect(JSON.stringify(json)).not.toContain(searchCriteria2);
        }
      }
    });
  });
};

export const runRuleGroupTests = async (
  page: Page,
  field: EntityFields,
  operator: string,
  isGroupTest: boolean,
  searchCriteria: Record<string, string[]>
) => {
  const searchCriteria1 = searchCriteria[field.name][0];
  const searchCriteria2 = searchCriteria[field.name][1];

  const testCases = [
    {
      condition1: CONDITIONS_MUST.equalTo.name,
      condition2: CONDITIONS_MUST_NOT.notEqualTo.name,
    },
    {
      condition1: CONDITIONS_MUST.contains.name,
      condition2: CONDITIONS_MUST_NOT.notContains.name,
    },
    {
      condition1: CONDITIONS_MUST.anyIn.name,
      condition2: CONDITIONS_MUST_NOT.notIn.name,
    },
  ];

  for (const { condition1, condition2 } of testCases) {
    await checkAddRuleOrGroupWithOperator(
      page,
      {
        field,
        operator,
        condition1,
        condition2,
        searchCriteria1,
        searchCriteria2,
      },
      isGroupTest
    );
    await page.getByTestId('clear-filters').click();
  }
};
