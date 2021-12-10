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

import React, { FunctionComponent, useEffect, useState } from 'react';
import PageLayout from '../../components/containers/PageLayout';
import Loader from '../../components/Loader/Loader';
import { Team } from '../../generated/entity/teams/team';
import { User } from '../../generated/entity/teams/user';
import { getCountBadge } from '../../utils/CommonUtils';
import UserDataCard from '../UserDataCard/UserDataCard';

interface Props {
  teams: Array<Team>;
  allUsers: Array<User>;
  isLoading: boolean;
}

const UserList: FunctionComponent<Props> = ({
  allUsers = [],
  isLoading,
  teams = [],
}: Props) => {
  const [userList, setUserList] = useState<Array<User>>(allUsers);
  const [users, setUsers] = useState<Array<User>>([]);
  const [admins, setAdmins] = useState<Array<User>>([]);
  const [currentTeam, setCurrentTeam] = useState<Team>();
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<User>();

  if (selectedUser) {
    selectedUser;
  }

  const selectTeam = (team?: Team) => {
    setCurrentTeam(team);
    if (team) {
      const userIds = (team.users || []).map((userData) => userData.id);
      const filteredUsers = allUsers.filter((user) =>
        userIds.includes(user.id)
      );
      setUserList(filteredUsers);
    } else {
      setUserList(allUsers);
    }
  };

  const selectUser = (id: string) => {
    const user = userList.find((user) => user.id === id);
    if (user) {
      setSelectedUser(user);
    } else {
      setSelectedUser(undefined);
    }
  };

  const getCurrentTeamClass = (name?: string) => {
    if ((!name && !currentTeam) || currentTeam?.name === name) {
      return 'tw-text-primary tw-font-medium';
    } else {
      return '';
    }
  };

  const isTeamBadgeActive = (name?: string) => {
    return (!name && !currentTeam) || currentTeam?.name === name;
  };

  const getActiveTabClass = (tab: number) => {
    return tab === currentTab ? 'active' : '';
  };

  const getTabs = () => {
    return (
      <div className="tw-mb-3 ">
        <nav
          className="tw-flex tw-flex-row tw-gh-tabs-container tw-px-4"
          data-testid="tabs">
          <button
            className={`tw-pb-2 tw-px-4 tw-gh-tabs ${getActiveTabClass(1)}`}
            data-testid="users"
            onClick={() => {
              setCurrentTab(1);
            }}>
            Users
            {getCountBadge(users.length, '', currentTab === 1)}
          </button>
          <button
            className={`tw-pb-2 tw-px-4 tw-gh-tabs ${getActiveTabClass(2)}`}
            data-testid="assets"
            onClick={() => {
              setCurrentTab(2);
            }}>
            Admins
            {getCountBadge(admins.length, '', currentTab === 2)}
          </button>
        </nav>
      </div>
    );
  };

  useEffect(() => {
    setUsers(userList.filter((user) => !user.isAdmin));
    setAdmins(userList.filter((user) => user.isAdmin));
  }, [userList]);

  useEffect(() => {
    if (!currentTeam) {
      setUserList(allUsers);
    }
  }, [allUsers]);

  const getLeftPanel = () => {
    return (
      <div className="tw-mt-5">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
          <div
            className={`tw-group tw-text-grey-body tw-cursor-pointer tw-text-body tw-flex tw-justify-between ${getCurrentTeamClass()}`}
            onClick={() => {
              selectTeam();
            }}>
            <p className="tw-text-center tag-category tw-self-center">
              All Users
            </p>
          </div>
          {getCountBadge(allUsers.length || 0, '', isTeamBadgeActive())}
        </div>
        {teams &&
          teams.map((team: Team) => (
            <div
              className="tw-flex tw-items-center tw-justify-between tw-mb-2"
              key={team.name}>
              <div
                className={`tw-group tw-text-grey-body tw-cursor-pointer tw-text-body tw-flex tw-justify-between ${getCurrentTeamClass(
                  team.name
                )}`}
                onClick={() => {
                  selectTeam(team);
                }}>
                <p className="tw-text-center tag-category tw-self-center">
                  {team.displayName}
                </p>
              </div>
              {getCountBadge(
                team.users?.length || 0,
                '',
                isTeamBadgeActive(team.name)
              )}
            </div>
          ))}
      </div>
    );
  };

  const getUserCards = (isAdmin = false) => {
    const listUserData = isAdmin ? admins : users;

    return (
      <>
        <div
          className="tw-grid xl:tw-grid-cols-4 md:tw-grid-cols-3 tw-gap-4"
          data-testid="user-card-container">
          {listUserData.map((user, index) => {
            const User = {
              description: user.displayName || user.name || '',
              name: user.name || '',
              id: user.id,
            };

            return (
              <UserDataCard
                isIconVisible
                item={User}
                key={index}
                onClick={selectUser}
              />
            );
          })}
        </div>
      </>
    );
  };

  return (
    <PageLayout leftPanel={getLeftPanel()}>
      {!isLoading ? (
        <>
          {getTabs()}
          {currentTab === 1 && getUserCards()}
          {currentTab === 2 && getUserCards(true)}
        </>
      ) : (
        <Loader />
      )}
    </PageLayout>
  );
};

export default UserList;
