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

import { Policy } from '../generated/entity/policies/policy';
import { Role } from '../generated/entity/teams/role';
import { Paging } from '../generated/type/paging';
import APIClient from './index';

export const getRoles = async (
  fields: string,
  after?: string,
  before?: string,
  defaultRoles = false,
  limit = 10
) => {
  const params = {
    default: defaultRoles,
    limit,
    fields,
    after,
    before,
  };

  const response = await APIClient.get<{ data: Role[]; paging: Paging }>(
    '/roles',
    { params }
  );

  return response.data;
};

export const getPolicies = async (
  fields: string,
  after?: string,
  before?: string,
  limit = 10
) => {
  const params = {
    limit,
    fields,
    after,
    before,
  };

  const response = await APIClient.get<{ data: Policy[]; paging: Paging }>(
    '/policies',
    { params }
  );

  return response.data;
};
