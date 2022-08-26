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

import {
  OperationPermission,
  PermissionMap,
} from '../components/PermissionProvider/PermissionProvider.interface';
import { EntityType } from '../enums/entity.enum';
import {
  Access,
  Permission,
  ResourcePermission,
} from '../generated/entity/policies/accessControl/resourcePermission';
import { Operation } from '../generated/entity/policies/policy';

export const hasPemission = (
  operation: Operation,
  entityType: EntityType,
  permissions: ResourcePermission[]
) => {
  const entityPermission = permissions.find(
    (permission) => permission.resource === entityType
  );

  const currentPermission = entityPermission?.permissions?.find(
    (permission) => permission.operation === operation
  );

  return currentPermission?.access === Access.Allow;
};

/**
 *
 * @param resource resource type like "bot", "table"
 * @param permission permissionMap - {resource:permissionList}
 * @returns OperationPermission - {Operation:true/false}
 */
export const getPermissions = (
  resource: EntityType,
  permission: PermissionMap
): OperationPermission => {
  const resourcePermissions = permission[resource] ?? [];

  return resourcePermissions.reduce(
    (acc: OperationPermission, curr: Permission) => {
      return {
        ...acc,
        [curr.operation as Operation]: curr.access === Access.Allow,
      };
    },
    {} as OperationPermission
  );
};

/**
 *
 * @param permissions Take ResourcePermission list
 * @returns PermissionMap - {resource:permissionList}
 */
export const getPermissionMap = (
  permissions: ResourcePermission[]
): PermissionMap => {
  return permissions.reduce((acc: PermissionMap, curr: ResourcePermission) => {
    return { ...acc, [curr.resource]: curr.permissions };
  }, {});
};

export const LIST_CAP = 1;
