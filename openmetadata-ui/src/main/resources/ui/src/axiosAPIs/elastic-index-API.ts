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

import axiosClient from '.';
import {
  EventPublisherJob,
  PublisherType,
} from '../generated/settings/eventPublisherJob';

export const getAllReIndexStatus = async () => {
  const res = await axiosClient.get<EventPublisherJob>(
    `/indexResource/reindex/status`
  );

  return res.data;
};

export const getReIndexStatusByEntityName = async (entityName: string) => {
  const res = await axiosClient.get(
    `/indexResource/reindex/${entityName}/status`
  );

  return res;
};

export const reIndexByPublisher = async (
  type: PublisherType = PublisherType.ElasticSearch
) => {
  const res = await axiosClient.post('/indexResource/reindex', {
    batchSize: 0,
    name: 'string',
    publisherType: type,
    recreateIndex: true,
    runMode: 'stream',
  });

  return res;
};

export const reIndexByEntityName = async (entityName: string) => {
  const res = await axiosClient.post(`indexResource/reindex/${entityName}`);

  return res;
};
