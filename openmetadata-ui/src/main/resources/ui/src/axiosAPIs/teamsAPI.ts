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

import { AxiosResponse } from 'axios';
import { Operation } from 'fast-json-patch';
import { isString } from 'lodash';
import { Team } from '../generated/entity/teams/team';
import { Paging } from '../generated/type/paging';
import { getURLWithQueryFields } from '../utils/APIUtils';
import APIClient from './index';

export const getTeams = async (
  arrQueryFields?: string | string[],
  params?: {
    limit?: number;
    before?: string;
    after?: string;
    parentTeam?: string;
    include?: string;
  }
) => {
  const updatedParams = {
    fields: isString(arrQueryFields)
      ? arrQueryFields
      : arrQueryFields?.join(','),
    limit: 100000,
    ...params,
  };
  const url = getURLWithQueryFields('/teams', arrQueryFields);

  const response = await APIClient.get<{ data: Team[]; paging: Paging }>(url, {
    params: updatedParams,
  });

  return response.data;
};

export const getTeamByName = async (
  name: string,
  arrQueryFields?: string | string[]
) => {
  const url = getURLWithQueryFields(`/teams/name/${name}`, arrQueryFields);

  const response = await APIClient.get<Team>(url);

  return response.data;
};

export const createTeam = async (data: Team) => {
  const response = await APIClient.post<Team>('/teams', data);

  return response.data;
};

export const patchTeamDetail = async (id: string, data: Operation[]) => {
  const configOptions = {
    headers: { 'Content-type': 'application/json-patch+json' },
  };

  const response = await APIClient.patch<Operation[], AxiosResponse<Team>>(
    `/teams/${id}`,
    data,
    configOptions
  );

  return response.data;
};

export const deleteTeam = async (id: string) => {
  const response = await APIClient.delete<Team>(`/teams/${id}`);

  return response.data;
};
