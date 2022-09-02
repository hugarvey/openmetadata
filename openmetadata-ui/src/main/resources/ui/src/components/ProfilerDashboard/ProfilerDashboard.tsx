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
import { Button, Col, Form, Radio, Row, Select, Space } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { AxiosError } from 'axios';
import { EntityTags, ExtraInfo } from 'Models';
import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { addFollower, removeFollower } from '../../axiosAPIs/tableAPI';
import { FQN_SEPARATOR_CHAR } from '../../constants/char.constants';
import {
  getDatabaseDetailsPath,
  getDatabaseSchemaDetailsPath,
  getServiceDetailsPath,
  getTableTabPath,
  getTeamAndUserDetailsPath,
} from '../../constants/constants';
import { PROFILER_FILTER_RANGE } from '../../constants/profiler.constant';
import { EntityType, FqnPart } from '../../enums/entity.enum';
import { ServiceCategory } from '../../enums/service.enum';
import { ProfilerDashboardType } from '../../enums/table.enum';
import { OwnerType } from '../../enums/user.enum';
import {
  Column,
  Table,
  TestCaseStatus,
} from '../../generated/entity/data/table';
import { EntityType as TestType } from '../../generated/tests/testDefinition';
import { EntityReference } from '../../generated/type/entityReference';
import { LabelType, State } from '../../generated/type/tagLabel';
import jsonData from '../../jsons/en';
import {
  getCurrentUserId,
  getEntityName,
  getEntityPlaceHolder,
  getNameFromFQN,
  getPartialNameFromTableFQN,
} from '../../utils/CommonUtils';
import { getAddDataQualityTableTestPath } from '../../utils/RouterUtils';
import { serviceTypeLogo } from '../../utils/ServiceUtils';
import {
  generateEntityLink,
  getTagsWithoutTier,
  getTierTags,
  getUsagePercentile,
} from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import EntityPageInfo from '../common/entityPageInfo/EntityPageInfo';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';
import PageLayout from '../containers/PageLayout';
import DataQualityTab from './component/DataQualityTab';
import ProfilerTab from './component/ProfilerTab';
import {
  ProfilerDashboardProps,
  ProfilerDashboardTab,
} from './profilerDashboard.interface';
import './profilerDashboard.less';

const ProfilerDashboard: React.FC<ProfilerDashboardProps> = ({
  table,
  testCases,
  fetchProfilerData,
  fetchTestCases,
  onTestCaseUpdate,
  profilerData,
  onTableChange,
}) => {
  const history = useHistory();
  const { entityTypeFQN, dashboardType } = useParams<Record<string, string>>();
  const isColumnView = dashboardType === ProfilerDashboardType.COLUMN;
  const [follower, setFollower] = useState<EntityReference[]>([]);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ProfilerDashboardTab>(
    isColumnView
      ? ProfilerDashboardTab.PROFILER
      : ProfilerDashboardTab.DATA_QUALITY
  );
  const [selectedTestCaseStatus, setSelectedTestCaseStatus] =
    useState<string>('');
  const [selectedTestType, setSelectedTestType] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] =
    useState<keyof typeof PROFILER_FILTER_RANGE>('last3days');
  const [activeColumnDetails, setActiveColumnDetails] = useState<Column>(
    {} as Column
  );

  const tabOptions = useMemo(() => {
    return Object.values(ProfilerDashboardTab).filter((value) => {
      if (value === ProfilerDashboardTab.PROFILER) {
        return isColumnView;
      }

      return value;
    });
  }, [dashboardType]);

  const timeRangeOption = useMemo(() => {
    return Object.entries(PROFILER_FILTER_RANGE).map(([key, value]) => ({
      label: value.title,
      value: key,
    }));
  }, []);

  const testCaseStatusOption = useMemo(() => {
    const testCaseStatus: Record<string, string>[] = Object.values(
      TestCaseStatus
    ).map((value) => ({
      label: value,
      value: value,
    }));
    testCaseStatus.unshift({
      label: 'All',
      value: '',
    });

    return testCaseStatus;
  }, []);

  const testCaseTypeOption = useMemo(() => {
    const testCaseStatus: Record<string, string>[] = Object.entries(
      TestType
    ).map(([key, value]) => ({
      label: key,
      value: value,
    }));
    testCaseStatus.unshift({
      label: 'All',
      value: '',
    });

    return testCaseStatus;
  }, []);

  const tier = useMemo(() => getTierTags(table.tags ?? []), [table]);
  const breadcrumb = useMemo(() => {
    const serviceName = getEntityName(table.service);
    const fqn = table.fullyQualifiedName || '';
    const columnName = getPartialNameFromTableFQN(entityTypeFQN, [
      FqnPart.NestedColumn,
    ]);

    const data: TitleBreadcrumbProps['titleLinks'] = [
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
        url: getDatabaseDetailsPath(table.database?.fullyQualifiedName || ''),
      },
      {
        name: getPartialNameFromTableFQN(fqn, [FqnPart.Schema]),
        url: getDatabaseSchemaDetailsPath(
          table.databaseSchema?.fullyQualifiedName || ''
        ),
      },
      {
        name: getEntityName(table),
        url: isColumnView
          ? getTableTabPath(table.fullyQualifiedName || '', 'profiler')
          : '',
      },
    ];

    if (isColumnView) {
      data.push({
        name: columnName,
        url: '',
        activeTitle: true,
      });
    }

    return data;
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
        } Queries`,
      },
    ];
  }, [table]);

  const handleOwnerUpdate = (newOwner?: Table['owner']) => {
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

  const handleTierUpdate = (newTier?: string) => {
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
  const handleTagUpdate = (selectedTags?: Array<EntityTags>) => {
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
    if (ProfilerDashboardTab.SUMMARY === value) {
      history.push(getTableTabPath(table.fullyQualifiedName || '', 'profiler'));
    } else if (ProfilerDashboardTab.DATA_QUALITY === value) {
      fetchTestCases(generateEntityLink(entityTypeFQN, true));
    }
    setSelectedTestCaseStatus('');
    setActiveTab(value);
  };

  const handleAddTestClick = () => {
    history.push(
      getAddDataQualityTableTestPath(
        isColumnView
          ? ProfilerDashboardType.COLUMN
          : ProfilerDashboardType.TABLE,
        entityTypeFQN || ''
      )
    );
  };

  const handleTimeRangeChange = (value: keyof typeof PROFILER_FILTER_RANGE) => {
    if (value !== selectedTimeRange) {
      setSelectedTimeRange(value);
      if (activeTab === ProfilerDashboardTab.PROFILER) {
        fetchProfilerData(entityTypeFQN, PROFILER_FILTER_RANGE[value].days);
      }
    }
  };

  const handleTestCaseStatusChange = (value: string) => {
    if (value !== selectedTestCaseStatus) {
      setSelectedTestCaseStatus(value);
    }
  };

  const handleTestCaseTypeChange = (value: string) => {
    if (value !== selectedTestType) {
      setSelectedTestType(value);
    }
  };

  const getFilterTestCase = () => {
    const dataByStatus = testCases.filter(
      (data) =>
        selectedTestCaseStatus === '' ||
        data.testCaseResult?.testCaseStatus === selectedTestCaseStatus
    );

    return isColumnView
      ? dataByStatus
      : dataByStatus.filter(
          (data) =>
            selectedTestType === '' ||
            (selectedTestType === TestType.Table &&
              entityTypeFQN === data.entityFQN) ||
            (selectedTestType === TestType.Column &&
              entityTypeFQN !== data.entityFQN)
        );
  };

  useEffect(() => {
    if (table) {
      if (isColumnView) {
        const columnName = getNameFromFQN(entityTypeFQN);
        const selectedColumn = table.columns.find(
          (col) => col.name === columnName
        );
        setActiveColumnDetails(selectedColumn || ({} as Column));
      }
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
            isFollowing={isFollowing}
            tags={getTagsWithoutTier(table.tags || [])}
            tagsHandler={handleTagUpdate}
            tier={tier}
            titleLinks={breadcrumb}
            updateOwner={handleOwnerUpdate}
            updateTier={handleTierUpdate}
          />
        </Col>
        <Col span={24}>
          <Row justify="space-between">
            <Radio.Group
              buttonStyle="solid"
              optionType="button"
              options={tabOptions}
              value={activeTab}
              onChange={handleTabChange}
            />

            <Space size={16}>
              {activeTab === ProfilerDashboardTab.DATA_QUALITY &&
                !isColumnView && (
                  <Form.Item className="tw-mb-0 tw-w-40" label="Type">
                    <Select
                      options={testCaseTypeOption}
                      value={selectedTestType}
                      onChange={handleTestCaseTypeChange}
                    />
                  </Form.Item>
                )}
              {activeTab === ProfilerDashboardTab.DATA_QUALITY && (
                <Form.Item className="tw-mb-0 tw-w-40" label="Status">
                  <Select
                    options={testCaseStatusOption}
                    value={selectedTestCaseStatus}
                    onChange={handleTestCaseStatusChange}
                  />
                </Form.Item>
              )}
              {activeTab === ProfilerDashboardTab.PROFILER && (
                <Select
                  className="tw-w-32"
                  options={timeRangeOption}
                  value={selectedTimeRange}
                  onChange={handleTimeRangeChange}
                />
              )}
              <Button type="primary" onClick={handleAddTestClick}>
                Add Test
              </Button>
            </Space>
          </Row>
        </Col>
        {activeTab === ProfilerDashboardTab.PROFILER && (
          <Col span={24}>
            <ProfilerTab
              activeColumnDetails={activeColumnDetails}
              profilerData={profilerData}
              tableProfile={table.profile}
            />
          </Col>
        )}

        {activeTab === ProfilerDashboardTab.DATA_QUALITY && (
          <Col span={24}>
            <DataQualityTab
              testCases={getFilterTestCase()}
              onTestUpdate={onTestCaseUpdate}
            />
          </Col>
        )}
      </Row>
    </PageLayout>
  );
};

export default ProfilerDashboard;
