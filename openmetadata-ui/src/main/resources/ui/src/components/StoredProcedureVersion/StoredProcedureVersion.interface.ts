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

import { OperationPermission } from '../../components/PermissionProvider/PermissionProvider.interface';
import { StoredProcedure } from '../../generated/entity/data/storedProcedure';
import { EntityHistory } from '../../generated/type/entityHistory';
import { TagLabel } from '../../generated/type/tagLabel';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';

export interface StoredProcedureVersionProp {
  version: string;
  currentVersionData: StoredProcedure;
  isVersionLoading: boolean;
  owner: StoredProcedure['owner'];
  domain: StoredProcedure['domain'];
  tier: TagLabel;
  slashedTableName: TitleBreadcrumbProps['titleLinks'];
  versionList: EntityHistory;
  deleted?: boolean;
  backHandler: () => void;
  versionHandler: (v: string) => void;
  entityPermissions: OperationPermission;
}
