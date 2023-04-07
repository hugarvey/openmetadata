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
import axiosClient from '.';
import { CreateEventPublisherJob } from '../generated/api/createEventPublisherJob';
import {
  EventPublisherJob,
  PublisherType,
} from '../generated/system/eventPublisherJob';

export const getStreamJobReIndexStatus = async () => {
  const res = await axiosClient.get<EventPublisherJob>(
    `/search/reindex/stream/status`
  );

  return res.data;
};

export const getBatchJobReIndexStatus = async () => {
  const res = await axiosClient.get<EventPublisherJob>(`search/reindex/latest`);

  return res.data;
};

export const reIndexByPublisher = async (data: CreateEventPublisherJob) => {
  const payload = {
    ...data,
    publisherType: PublisherType.ElasticSearch,
  };

  const res = await axiosClient.post<
    CreateEventPublisherJob,
    AxiosResponse<EventPublisherJob>
  >('/search/reindex', payload);

  return res.data;
};
