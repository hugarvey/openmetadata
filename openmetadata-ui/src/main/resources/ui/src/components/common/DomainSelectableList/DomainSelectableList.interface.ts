/*
 *  Copyright 2023 Collate.
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
import { EntityReference } from 'generated/entity/type';
import { ReactNode } from 'react';

export interface DomainSelectableListProps {
  onUpdate: (domain: EntityReference) => void;
  children?: ReactNode;
  hasPermission: boolean;
  popoverProps?: PopoverProps;
  selectedDomain?: EntityReference;
}
