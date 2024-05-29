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
import { PopoverProps } from 'antd';
import { ReactNode } from 'react';
import { EntityReference } from '../../../generated/entity/type';

type MultipleUserTeam = {
  user: boolean;
  team: boolean;
};

export interface UserTeamSelectableListV2Props {
  hasPermission: boolean;
  owner?: EntityReference[];
  onUpdate: (updatedUser: EntityReference[]) => void | Promise<void>;
  children?: ReactNode;
  popoverProps?: PopoverProps;
  multiple?: MultipleUserTeam;
}
