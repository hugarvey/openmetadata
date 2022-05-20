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

import classNames from 'classnames';
import { startCase, uniqueId } from 'lodash';
import { observer } from 'mobx-react';
import { EntityTags, ExtraInfo } from 'Models';
import React, {
  FC,
  Fragment,
  HTMLAttributes,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AppState from '../../AppState';
import {
  getDashboardDetailsPath,
  getTeamAndUserDetailsPath,
} from '../../constants/constants';
import { EntityType } from '../../enums/entity.enum';
import { OwnerType } from '../../enums/user.enum';
import { Mlmodel } from '../../generated/entity/data/mlmodel';
import { EntityReference } from '../../generated/type/entityReference';
import { LabelType, State, TagLabel } from '../../generated/type/tagLabel';
import {
  getEntityName,
  getEntityPlaceHolder,
  getUserTeams,
} from '../../utils/CommonUtils';
import { getTagsWithoutTier, getTierTags } from '../../utils/TableUtils';
import Description from '../common/description/Description';
import EntityPageInfo from '../common/entityPageInfo/EntityPageInfo';
import TabsPane from '../common/TabsPane/TabsPane';
import { TitleBreadcrumbProps } from '../common/title-breadcrumb/title-breadcrumb.interface';
import PageContainer from '../containers/PageContainer';
import ManageTabComponent from '../ManageTab/ManageTab.component';

interface MlModelDetailProp extends HTMLAttributes<HTMLDivElement> {
  mlModelDetail: Mlmodel;
  activeTab: number;
  followMlModelHandler: () => void;
  unfollowMlModelHandler: () => void;
  descriptionUpdateHandler: (updatedMlModel: Mlmodel) => void;
  setActiveTabHandler: (value: number) => void;
  tagUpdateHandler: (updatedMlModel: Mlmodel) => void;
  settingsUpdateHandler: (updatedMlModel: Mlmodel) => Promise<void>;
}

const MlModelDetail: FC<MlModelDetailProp> = ({
  mlModelDetail,
  activeTab,
  followMlModelHandler,
  unfollowMlModelHandler,
  descriptionUpdateHandler,
  setActiveTabHandler,
  tagUpdateHandler,
  settingsUpdateHandler,
}) => {
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const [isEdit, setIsEdit] = useState(false);

  const loggedInUserId = AppState.getCurrentUserDetails()?.id;

  const mlModelTier = useMemo(() => {
    return getTierTags(mlModelDetail.tags || []) as TagLabel;
  }, [mlModelDetail.tags]);

  const mlModelTags = useMemo(() => {
    return getTagsWithoutTier(mlModelDetail.tags || []);
  }, [mlModelDetail.tags]);

  const slashedMlModelName: TitleBreadcrumbProps['titleLinks'] = [
    {
      name: getEntityName(mlModelDetail as unknown as EntityReference),
      url: '',
      activeTitle: true,
    },
  ];

  const mlModelPageInfo: ExtraInfo[] = [
    {
      key: 'Owner',
      value:
        mlModelDetail.owner?.type === 'team'
          ? getTeamAndUserDetailsPath(mlModelDetail.owner?.name || '')
          : getEntityName(mlModelDetail.owner),
      placeholderText: getEntityPlaceHolder(
        getEntityName(mlModelDetail.owner),
        mlModelDetail.owner?.deleted
      ),
      isLink: mlModelDetail.owner?.type === 'team',
      openInNewTab: false,
      profileName:
        mlModelDetail.owner?.type === OwnerType.USER
          ? mlModelDetail.owner?.name
          : undefined,
    },
    {
      key: 'Algorithm',
      value: mlModelDetail.algorithm,
      showLabel: true,
    },
    {
      key: 'Target',
      value: mlModelDetail.target,
      showLabel: true,
    },
    {
      key: 'Server',
      value: mlModelDetail.server,
      showLabel: true,
      isLink: true,
    },
    {
      key: 'Dashboard',
      value: getDashboardDetailsPath(
        mlModelDetail.dashboard?.fullyQualifiedName as string
      ),
      placeholderText: getEntityName(mlModelDetail.dashboard),
      showLabel: true,
      isLink: true,
    },
  ];

  const hasEditAccess = () => {
    if (mlModelDetail.owner?.type === 'user') {
      return mlModelDetail.owner?.id === loggedInUserId;
    } else {
      return getUserTeams().some((team) => team.id === mlModelDetail.owner?.id);
    }
  };

  const tabs = [
    {
      name: 'Summary',
      icon: {
        alt: 'summary',
        name: 'icon-summary',
        title: 'Summary',
        selectedName: 'icon-summarycolor',
      },
      isProtected: false,
      position: 1,
    },
    {
      name: 'Features',
      icon: {
        alt: 'features',
        name: 'icon-features',
        title: 'Features',
        selectedName: 'icon-featurescolor',
      },
      isProtected: false,
      position: 2,
    },
    {
      name: 'Manage',
      icon: {
        alt: 'manage',
        name: 'icon-manage',
        title: 'Manage',
        selectedName: 'icon-managecolor',
      },
      isProtected: false,
      isHidden: mlModelDetail.deleted,
      protectedState: !mlModelDetail.owner || hasEditAccess(),
      position: 3,
    },
  ];

  const setFollowersData = (followers: Array<EntityReference>) => {
    setIsFollowing(
      followers.some(({ id }: { id: string }) => id === loggedInUserId)
    );
    setFollowersCount(followers.length);
  };

  const followMlModel = () => {
    if (isFollowing) {
      setFollowersCount((preValu) => preValu - 1);
      setIsFollowing(false);
      unfollowMlModelHandler();
    } else {
      setFollowersCount((preValu) => preValu + 1);
      setIsFollowing(true);
      followMlModelHandler();
    }
  };

  const onDescriptionEdit = (): void => {
    setIsEdit(true);
  };
  const onCancel = () => {
    setIsEdit(false);
  };

  const onDescriptionUpdate = (updatedHTML: string) => {
    if (mlModelDetail.description !== updatedHTML) {
      const updatedMlModelDetails = {
        ...mlModelDetail,
        description: updatedHTML,
      };
      descriptionUpdateHandler(updatedMlModelDetails);
      setIsEdit(false);
    } else {
      setIsEdit(false);
    }
  };

  const onTagUpdate = (selectedTags?: Array<EntityTags>) => {
    if (selectedTags) {
      const updatedTags = [
        ...(mlModelTier ? [mlModelTier] : []),
        ...selectedTags,
      ];
      const updatedMlModel = { ...mlModelDetail, tags: updatedTags };
      tagUpdateHandler(updatedMlModel);
    }
  };

  const onSettingsUpdate = (newOwner?: Mlmodel['owner'], newTier?: string) => {
    if (newOwner || newTier) {
      const tierTag: Mlmodel['tags'] = newTier
        ? [
            ...mlModelTags,
            {
              tagFQN: newTier,
              labelType: LabelType.Manual,
              state: State.Confirmed,
            },
          ]
        : mlModelDetail.tags;
      const updatedMlModelDetails = {
        ...mlModelDetail,
        owner: newOwner
          ? {
              ...mlModelDetail.owner,
              ...newOwner,
            }
          : mlModelDetail.owner,
        tags: tierTag,
      };

      return settingsUpdateHandler(updatedMlModelDetails);
    } else {
      return Promise.reject();
    }
  };

  const getMlHyperParameters = () => {
    return (
      <div className="tw-flex tw-flex-col tw-mt-3">
        <hr className="tw-my-4" />
        <h6 className="tw-font-medium tw-text-base">Hyper Parameters</h6>
        <table
          className="tw-w-full tw-mt-3"
          data-testid="hyperparameters-table"
          id="hyperparameters-table">
          <thead>
            <tr className="tableHead-row">
              <th className="tableHead-cell">Name</th>
              <th className="tableHead-cell">Value</th>
            </tr>
          </thead>
          <tbody className="tableBody">
            {mlModelDetail.mlHyperParameters &&
            mlModelDetail.mlHyperParameters.length ? (
              <Fragment>
                {mlModelDetail.mlHyperParameters.map((param) => (
                  <tr
                    className={classNames('tableBody-row')}
                    data-testid="tableBody-row"
                    key={uniqueId()}>
                    <td className="tableBody-cell" data-testid="tableBody-cell">
                      {param.name}
                    </td>
                    <td className="tableBody-cell" data-testid="tableBody-cell">
                      {param.value}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ) : (
              <tr
                className={classNames('tableBody-row')}
                data-testid="tableBody-row"
                key={uniqueId()}>
                <td
                  className="tableBody-cell tw-text-center"
                  colSpan={2}
                  data-testid="tableBody-cell">
                  No Data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const getMlModelStore = () => {
    return (
      <div className="tw-flex tw-flex-col tw-mt-3">
        <hr className="tw-my-4" />
        <h6 className="tw-font-medium tw-text-base">Model Store</h6>
        {mlModelDetail.mlStore ? (
          <table
            className="tw-w-full tw-mt-3"
            data-testid="modle-store-table"
            id="modle-store-table">
            <thead>
              <tr className="tableHead-row">
                {Object.keys(mlModelDetail.mlStore).map((key) => (
                  <th className="tableHead-cell" key={uniqueId()}>
                    {startCase(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tableBody">
              <tr
                className={classNames('tableBody-row')}
                data-testid="tableBody-row"
                key={uniqueId()}>
                <td className="tableBody-cell" data-testid="tableBody-cell">
                  <span>
                    <a
                      href={mlModelDetail.mlStore.storage}
                      rel="noreferrer"
                      target="_blank">
                      {mlModelDetail.mlStore.storage}
                    </a>
                  </span>
                </td>
                <td className="tableBody-cell" data-testid="tableBody-cell">
                  <span>
                    <a
                      href={mlModelDetail.mlStore.imageRepository}
                      rel="noreferrer"
                      target="_blank">
                      {mlModelDetail.mlStore.imageRepository}
                    </a>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <span className="tw-text-grey-muted tw-text-center">No Data</span>
        )}
      </div>
    );
  };

  const getMlModelFeatures = () => {
    if (mlModelDetail.mlFeatures && mlModelDetail.mlFeatures.length) {
      return (
        <div className="tw-flex tw-flex-col">
          <h6 className="tw-font-medium tw-text-base">Features used</h6>
          <table
            className="tw-w-full tw-mt-3"
            data-testid="hyperparameters-table"
            id="hyperparameters-table">
            <thead>
              <tr className="tableHead-row">
                <th className="tableHead-cell">Name</th>
                <th className="tableHead-cell">Data Type</th>
                <th className="tableHead-cell">Description</th>
              </tr>
            </thead>
            <tbody className="tableBody">
              {mlModelDetail.mlFeatures.map((feature) => (
                <tr
                  className={classNames('tableBody-row')}
                  data-testid="tableBody-row"
                  key={uniqueId()}>
                  <td className="tableBody-cell" data-testid="tableBody-cell">
                    {feature.name}
                  </td>
                  <td className="tableBody-cell" data-testid="tableBody-cell">
                    {feature.dataType}
                  </td>
                  <td className="tableBody-cell" data-testid="tableBody-cell">
                    {feature.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return (
        <div className="tw-flex tw-justify-center tw-font-medium tw-items-center tw-border tw-border-main tw-rounded-md tw-p-8">
          No features data available
        </div>
      );
    }
  };

  useEffect(() => {
    setFollowersData(mlModelDetail.followers || []);
  }, [
    mlModelDetail.followers,
    AppState.userDetails,
    AppState.nonSecureUserDetails,
  ]);

  return (
    <PageContainer>
      <div className="tw-px-6 tw-w-full tw-h-full tw-flex tw-flex-col">
        <EntityPageInfo
          isTagEditable
          deleted={mlModelDetail.deleted}
          entityFqn={mlModelDetail.fullyQualifiedName}
          entityName={mlModelDetail.name}
          entityType={EntityType.MLMODEL}
          extraInfo={mlModelPageInfo}
          followHandler={followMlModel}
          followers={followersCount}
          followersList={mlModelDetail.followers || []}
          hasEditAccess={hasEditAccess()}
          isFollowing={isFollowing}
          tags={mlModelTags}
          tagsHandler={onTagUpdate}
          tier={mlModelTier}
          titleLinks={slashedMlModelName}
        />

        <div className="tw-mt-4 tw-flex tw-flex-col tw-flex-grow">
          <TabsPane
            activeTab={activeTab}
            className="tw-flex-initial"
            setActiveTab={setActiveTabHandler}
            tabs={tabs}
          />
          <div className="tw-flex-grow tw-flex tw-flex-col tw--mx-6 tw-px-7 tw-py-4">
            <div className="tw-bg-white tw-flex-grow tw-p-4 tw-shadow tw-rounded-md">
              {activeTab === 1 && (
                <Fragment>
                  <Description
                    description={mlModelDetail.description}
                    entityFqn={mlModelDetail.fullyQualifiedName}
                    entityName={mlModelDetail.name}
                    entityType={EntityType.MLMODEL}
                    hasEditAccess={hasEditAccess()}
                    isEdit={isEdit}
                    isReadOnly={mlModelDetail.deleted}
                    owner={mlModelDetail.owner}
                    onCancel={onCancel}
                    onDescriptionEdit={onDescriptionEdit}
                    onDescriptionUpdate={onDescriptionUpdate}
                  />
                  {getMlHyperParameters()}
                  {getMlModelStore()}
                </Fragment>
              )}
              {activeTab === 2 && <div>{getMlModelFeatures()}</div>}
              {activeTab === 3 && !mlModelDetail.deleted && (
                <div>
                  <ManageTabComponent
                    allowDelete
                    currentTier={mlModelTier?.tagFQN}
                    currentUser={mlModelDetail.owner}
                    entityId={mlModelDetail.id}
                    entityName={mlModelDetail.name}
                    entityType={EntityType.MLMODEL}
                    hasEditAccess={hasEditAccess()}
                    onSave={onSettingsUpdate}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default observer(MlModelDetail);
