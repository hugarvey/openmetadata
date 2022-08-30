/*
 *  Copyright 2022 Collate
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

import { CreateTestCase } from '../generated/api/tests/createTestCase';
import { CreateTestSuite } from '../generated/api/tests/createTestSuite';
import { TestCase, TestCaseResult } from '../generated/tests/testCase';
import { EntityType, TestDefinition } from '../generated/tests/testDefinition';
import { TestSuite } from '../generated/tests/testSuite';
import { Include } from '../generated/type/include';
import { Paging } from '../generated/type/paging';
import APIClient from './index';

export type ListParams = {
  fields?: string;
  limit?: number;
  before?: string;
  after?: string;
  include?: Include;
};

export type ListTestCaseParams = ListParams & {
  entityLink?: string;
  testSuiteId?: string;
  includeAllTests?: boolean;
};

export type ListTestDefinitionsParams = ListParams & {
  entityType?: EntityType;
};

export type ListTestCaseResultsParams = Omit<
  ListParams,
  'fields' | 'include'
> & {
  startTs?: number;
  endTs?: number;
};

const testCaseUrl = '/testCase';
const testSuiteUrl = '/testSuite';
const testDefinitionUrl = '/testDefinition';

// testCase section
export const getListTestCase = async (params?: ListTestCaseParams) => {
  const response = await APIClient.get<{ data: TestCase[]; paging: Paging }>(
    testCaseUrl,
    {
      params,
    }
  );

  return response.data;
};

export const getListTestCaseResults = async (
  fqn: string,
  params?: ListTestCaseResultsParams
) => {
  const url = `${testCaseUrl}/${fqn}/testCaseResult`;
  const response = await APIClient.get<{
    data: TestCaseResult[];
    paging: Paging;
  }>(url, {
    params,
  });

  return response.data;
};

export const createTestCase = async (data: CreateTestCase) => {
  const response = await APIClient.post<TestCase>(testCaseUrl, data);

  return response.data;
};

// testSuite section
export const getListTestSuites = async (params?: ListParams) => {
  const response = await APIClient.get<{
    data: TestSuite[];
    paging: Paging;
  }>(testSuiteUrl, {
    params,
  });

  return response.data;
};

export const createTestSuites = async (data: CreateTestSuite) => {
  const response = await APIClient.post<TestSuite>(testSuiteUrl, data);

  return response.data;
};

// testDefinition Section
export const getListTestDefinitions = async (
  params?: ListTestDefinitionsParams
) => {
  const response = await APIClient.get<{
    data: TestDefinition[];
    paging: Paging;
  }>(testDefinitionUrl, {
    params,
  });

  return response.data;
};
