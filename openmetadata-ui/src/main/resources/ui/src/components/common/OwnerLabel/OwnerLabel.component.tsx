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
import { Space, Typography } from 'antd';
import { ReactComponent as IconTeamsGrey } from 'assets/svg/teams-grey.svg';
import { OwnerType } from 'enums/user.enum';
import { EntityReference } from 'generated/entity/data/table';
import { isUndefined } from 'lodash';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getEntityName } from 'utils/EntityUtils';
import ProfilePicture from '../ProfilePicture/ProfilePicture';
import { UserTeamSelectableList } from '../UserTeamSelectableList/UserTeamSelectableList.component';

export const OwnerLabel = ({
  owner,
  onUpdate,
  hasPermission,
}: {
  owner?: EntityReference;
  onUpdate: (owner?: EntityReference) => void;
  hasPermission?: boolean;
}) => {
  const displayName = getEntityName(owner);
  const { t } = useTranslation();

  const profilePicture = useMemo(() => {
    if (isUndefined(owner)) {
      return (
        <Typography.Text className="font-medium text-xs">
          {t('label.no-entity', { entity: t('label.owner') })}
        </Typography.Text>
      );
    }

    return owner.type === OwnerType.TEAM ? (
      <IconTeamsGrey height={18} width={18} />
    ) : (
      <ProfilePicture
        displayName={displayName}
        id={owner.id}
        key="profile-picture"
        name={owner.name ?? ''}
        type="circle"
        width="24"
      />
    );
  }, [owner]);

  return (
    <Space size={8}>
      {profilePicture}

      {displayName ? (
        <Typography.Link
          className="font-normal text-xs"
          style={{ fontSize: '12px' }}>
          {displayName}
        </Typography.Link>
      ) : null}
      <UserTeamSelectableList
        hasPermission={Boolean(hasPermission)}
        owner={owner}
        onUpdate={onUpdate}
      />
    </Space>
  );
};
