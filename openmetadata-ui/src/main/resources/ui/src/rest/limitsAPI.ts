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
import axiosClient from '.';
import { ResourceLimit } from '../context/LimitsProvider/useLimitsStore';
import { LimitsResponse } from '../generated/system/limitsResponse';

const BASE_URL = '/limits';

export const getLimitConfig = async () => {
  const response = await axiosClient.get<LimitsResponse>(`${BASE_URL}/config`);

  return response.data;
};

export const getLimitByResource = async (resource: string) => {
  const response = await axiosClient.get<ResourceLimit>(BASE_URL, {
    params: {
      resource,
    },
  });

  return response.data;
};
