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

import { Col, Radio, Row } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { AxiosError } from 'axios';
import { EntityTags, ExtraInfo } from 'Models';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { addFollower, removeFollower } from '../../axiosAPIs/tableAPI';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import {
  getDatabaseDetailsPath,
  getDatabaseSchemaDetailsPath,
  getServiceDetailsPath,
  getTableTabPath,
  getTeamAndUserDetailsPath,
} from '../../constants/constants';
import { EntityType, FqnPart } from '../../enums/entity.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { OwnerType } from '../../enums/user.enum';
import { Table } from '../../generated/entity/data/table';
import { EntityReference } from '../../generated/type/entityReference';
import { LabelType, State } from '../../generated/type/tagLabel';
import jsonData from '../../jsons/en';
import {
  getCurrentUserId,
  getEntityName,
  getEntityPlaceHolder,
  getPartialNameFromTableFQN,
  hasEditAccess,
} from '../../utils/CommonUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import {
  getTagsWithoutTier,
  getTierTags,
  getUsagePercentile,
} from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import EntityPageInfo from '../common/entityPageInfo/EntityPageInfo';
import PageLayout from '../containers/PageLayout';
import {
  ProfilerDashboardProps,
  ProfilerDashboardTab,
} from './profilerDashboard.interface';

const ProfilerDashboard: React.FC<ProfilerDashboardProps> = ({
  table,
  profilerData,
  onTableChange,
}) => {
  const history = useHistory();
  const [follower, setFollower] = useState<EntityReference[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ProfilerDashboardTab>(
    ProfilerDashboardTab.PROFILER
  );

  const tier = useMemo(() => getTierTags(table.tags ?? []), [table]);
  const breadcrumb = useMemo(() => {
    const serviceName = getEntityName(table.service);
    const fqn = table.fullyQualifiedName || '';

    return [
      {
        name: getEntityName(table.service),
        url: serviceName
          ? getServiceDetailsPath(
              serviceName,
              ServiceCategory.DATABASE_SERVICES
            )
          : '',
        imgSrc: table.serviceType
          ? serviceTypeLogo(table.serviceType)
          : undefined,
      },
      {
        name: getPartialNameFromTableFQN(fqn, [FqnPart.Database]),
        url: getDatabaseDetailsPath(fqn),
      },
      {
        name: getPartialNameFromTableFQN(fqn, [FqnPart.Schema]),
        url: getDatabaseSchemaDetailsPath(fqn),
      },
      {
        name: getEntityName(table),
        url: '',
        activeTitle: true,
      },
    ];
  }, [table]);

  const extraInfo: Array<ExtraInfo> = useMemo(() => {
    return [
      {
        key: 'Owner',
        value:
          table.owner?.type === OwnerType.TEAM
            ? getTeamAndUserDetailsPath(table.owner?.name || '')
            : getEntityName(table.owner),
        placeholderText: getEntityPlaceHolder(
          getEntityName(table.owner),
          table.owner?.deleted
        ),
        isLink: table.owner?.type === OwnerType.TEAM,
        openInNewTab: false,
        profileName:
          table.owner?.type === OwnerType.USER ? table.owner?.name : undefined,
      },
      {
        key: 'Tier',
        value: tier?.tagFQN ? tier.tagFQN.split(FQN_SEPARATOR_CHAR)[1] : '',
      },
      { key: 'Type', value: `${table.tableType}`, showLabel: true },
      {
        value:
          getUsagePercentile(
            table.usageSummary?.weeklyStats?.percentileRank || 0,
            true
          ) || '--',
      },
      {
        value: `${
          table.usageSummary?.weeklyStats?.count.toLocaleString() || '--'
        } queries`,
      },
    ];
  }, [table]);

  const onOwnerUpdate = (newOwner?: Table['owner']) => {
    if (newOwner) {
      const updatedTableDetails = {
        ...table,
        owner: {
          ...table.owner,
          ...newOwner,
        },
      };
      onTableChange(updatedTableDetails);
    }
  };

  const onTierUpdate = (newTier?: string) => {
    if (newTier) {
      const tierTag: Table['tags'] = newTier
        ? [
            ...getTagsWithoutTier(table.tags as Array<EntityTags>),
            {
              tagFQN: newTier,
              labelType: LabelType.Manual,
              state: State.Confirmed,
            },
          ]
        : table.tags;
      const updatedTableDetails = {
        ...table,
        tags: tierTag,
      };

      return onTableChange(updatedTableDetails);
    } else {
      return Promise.reject();
    }
  };

  /**
   * Formulates updated tags and updates table entity data for API call
   * @param selectedTags
   */
  const onTagUpdate = (selectedTags?: Array<EntityTags>) => {
    if (selectedTags) {
      const updatedTags = [...(tier ? [tier] : []), ...selectedTags];
      const updatedTable = { ...table, tags: updatedTags };
      onTableChange(updatedTable);
    }
  };

  const unfollowTable = async () => {
    try {
      const data = await removeFollower(table.id, getCurrentUserId());
      const { oldValue } = data.changeDescription.fieldsDeleted[0];

      setFollower(
        follower.filter((follower) => follower.id !== oldValue[0].id)
      );
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        jsonData['api-error-messages']['update-entity-unfollow-error']
      );
    }
  };
  const followTable = async () => {
    try {
      const data = await addFollower(table.id, getCurrentUserId());
      const { newValue } = data.changeDescription.fieldsAdded[0];

      setFollower([...follower, ...newValue]);
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        jsonData['api-error-messages']['update-entity-follow-error']
      );
    }
  };

  const handleFollowClick = () => {
    if (isFollowing) {
      setIsFollowing(false);
      unfollowTable();
    } else {
      setIsFollowing(true);
      followTable();
    }
  };

  const handleTabChange = (e: RadioChangeEvent) => {
    const value = e.target.value as ProfilerDashboardTab;
    if (ProfilerDashboardTab.SUMMERY === value) {
      history.push(getTableTabPath(table.fullyQualifiedName || '', 'profiler'));
    }
    setActiveTab(value);
  };

  useEffect(() => {
    if (table) {
      setFollower(table?.followers || []);
      setIsFollowing(
        follower.some(({ id }: { id: string }) => id === getCurrentUserId())
      );
    }
  }, [table]);

  return (
    <PageLayout>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <EntityPageInfo
            isTagEditable
            deleted={table.deleted}
            entityFqn={table.fullyQualifiedName}
            entityId={table.id}
            entityName={table.name}
            entityType={EntityType.TABLE}
            extraInfo={extraInfo}
            followHandler={handleFollowClick}
            followers={follower.length}
            followersList={follower}
            hasEditAccess={hasEditAccess(
              table.owner?.type || '',
              table.owner?.id || ''
            )}
            isFollowing={isFollowing}
            tags={getTagsWithoutTier(table.tags || [])}
            tagsHandler={onTagUpdate}
            tier={tier}
            titleLinks={breadcrumb}
            updateOwner={onOwnerUpdate}
            updateTier={onTierUpdate}
          />
        </Col>
        <Col span={8}>
          <Radio.Group
            buttonStyle="solid"
            optionType="button"
            options={Object.values(ProfilerDashboardTab)}
            value={activeTab}
            onChange={handleTabChange}
          />
        </Col>
        <Col offset={8} span={8}>
          col-8
        </Col>
      </Row>
    </PageLayout>
  );
};

export default ProfilerDashboard;
