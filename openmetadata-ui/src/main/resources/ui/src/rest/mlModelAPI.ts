/*
 *  Copyright 2022 Collate.
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
import { QueryVote } from 'components/TableQueries/TableQueries.interface';
import { Operation } from 'fast-json-patch';
import { EntityHistory } from 'generated/type/entityHistory';
import { PagingWithoutTotal, RestoreRequestType } from 'Models';
import { ServicePageData } from 'pages/ServiceDetailsPage/ServiceDetailsPage';
import { Mlmodel } from '../generated/entity/data/mlmodel';
import { EntityReference } from '../generated/type/entityReference';
import { Include } from '../generated/type/include';
import { Paging } from '../generated/type/paging';
import { getURLWithQueryFields } from '../utils/APIUtils';
import APIClient from './index';

const BASE_URL = '/mlmodels';

export const getMlModelVersions = async (id: string) => {
  const url = `${BASE_URL}/${id}/versions`;

  const response = await APIClient.get<EntityHistory>(url);

  return response.data;
};

export const getMlModelVersion = async (id: string, version: string) => {
  const url = `${BASE_URL}/${id}/versions/${version}`;

  const response = await APIClient.get<Mlmodel>(url);

  return response.data;
};

export const getMlModelByFQN = async (
  fqn: string,
  arrQueryFields: string | string[],
  include = Include.All
) => {
  const url = getURLWithQueryFields(
    `${BASE_URL}/name/${fqn}`,
    arrQueryFields,
    `include=${include}`
  );

  const response = await APIClient.get<Mlmodel>(url);

  return response.data;
};

export const getMlModels = async (
  service: string,
  fields: string,
  paging?: PagingWithoutTotal,
  include: Include = Include.NonDeleted
) => {
  const response = await APIClient.get<{
    data: ServicePageData[];
    paging: Paging;
  }>(`${BASE_URL}`, {
    params: {
      service,
      fields,
      ...paging,
      include,
    },
  });

  return response.data;
};

export const patchMlModelDetails = async (id: string, data: Operation[]) => {
  const configOptions = {
    headers: { 'Content-type': 'application/json-patch+json' },
  };

  const response = await APIClient.patch<Operation[], AxiosResponse<Mlmodel>>(
    `${BASE_URL}/${id}`,
    data,
    configOptions
  );

  return response.data;
};

export const addFollower = async (mlModelId: string, userId: string) => {
  const configOptions = {
    headers: { 'Content-type': 'application/json' },
  };

  const response = await APIClient.put<
    string,
    AxiosResponse<{
      changeDescription: { fieldsAdded: { newValue: EntityReference[] }[] };
    }>
  >(`${BASE_URL}/${mlModelId}/followers`, userId, configOptions);

  return response.data;
};

export const removeFollower = async (mlModelId: string, userId: string) => {
  const configOptions = {
    headers: { 'Content-type': 'application/json' },
  };

  const response = await APIClient.delete<
    string,
    AxiosResponse<{
      changeDescription: { fieldsDeleted: { oldValue: EntityReference[] }[] };
    }>
  >(`${BASE_URL}/${mlModelId}/followers/${userId}`, configOptions);

  return response.data;
};

export const restoreMlmodel = async (id: string) => {
  const response = await APIClient.put<
    RestoreRequestType,
    AxiosResponse<Mlmodel>
  >(`${BASE_URL}/restore`, { id });

  return response.data;
};

export const updateMlModelVotes = async (id: string, data: QueryVote) => {
  const response = await APIClient.put<QueryVote, AxiosResponse<Mlmodel>>(
    `${BASE_URL}/${id}/vote`,
    data
  );

  return response.data;
};
