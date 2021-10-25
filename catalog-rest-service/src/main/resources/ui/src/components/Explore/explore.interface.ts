/*
  * Licensed to the Apache Software Foundation (ASF) under one or more
  * contributor license agreements. See the NOTICE file distributed with
  * this work for additional information regarding copyright ownership.
  * The ASF licenses this file to You under the Apache License, Version 2.0
  * (the "License"); you may not use this file except in compliance with
  * the License. You may obtain a copy of the License at

  * http://www.apache.org/licenses/LICENSE-2.0

  * Unless required by applicable law or agreed to in writing, software
  * distributed under the License is distributed on an "AS IS" BASIS,
  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  * See the License for the specific language governing permissions and
  * limitations under the License.
*/

import { SearchResponse } from 'Models';

export type Params = {
  searchQuery: string;
  tab: string;
};

export type Service = {
  collection: {
    name: string;
    documentation: string;
    href: string;
  };
};
export type Team = {
  id: string;
  name: string;
  displayName: string;
  description: string;
  href: string;
};

export type ExploreSearchData = {
  resSearchResults: SearchResponse;
  resAggServiceType: SearchResponse;
  resAggTier: SearchResponse;
  resAggTag: SearchResponse;
};

export interface FetchData {
  queryString: string;
  from: number;
  size: number;
  filters: string;
  sortField: string;
  sortOrder: string;
  searchIndex: string;
}

export interface ExploreProps {
  tabCounts: {
    table: number;
    topic: number;
    dashboard: number;
    pipeline: number;
  };
  searchText: string;
  tab: string;
  error: string;
  isLoading: boolean;
  searchQuery: string;
  handleSearchText: (text: string) => void;
  updateTableCount: (count: number) => void;
  updateTopicCount: (count: number) => void;
  updateDashboardCount: (count: number) => void;
  updatePipelineCount: (count: number) => void;
  fetchData: (value: FetchData[]) => void;
  searchResult: ExploreSearchData | undefined;
}
