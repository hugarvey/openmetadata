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

import { SearchedDataProps } from 'components/searched-data/SearchedData.interface';
import { User } from '../../generated/entity/teams/user';

export interface Props {
  userData: User;
  followingEntities: {
    data: SearchedDataProps['data'];
    total: number;
    currPage: number;
  };
  ownedEntities: {
    data: SearchedDataProps['data'];
    total: number;
    currPage: number;
  };
  username: string;
  isUserEntitiesLoading: boolean;
  isAdminUser: boolean;
  isLoggedinUser: boolean;
  isAuthDisabled: boolean;
  updateUserDetails: (data: Partial<User>) => Promise<void>;
  onFollowingEntityPaginate: (page: string | number) => void;
  onOwnedEntityPaginate: (page: string | number) => void;
}

export enum UserPageTabs {
  ACTIVITY = 'activity_feed',
  MY_DATA = 'mydata',
  FOLLOWING = 'following',
}
