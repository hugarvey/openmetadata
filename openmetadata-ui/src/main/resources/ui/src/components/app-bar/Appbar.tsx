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

import { AxiosError, AxiosResponse } from 'axios';
import { CookieStorage } from 'cookie-storage';
import { isEmpty } from 'lodash';
import { observer } from 'mobx-react';
import { Match } from 'Models';
import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation, useRouteMatch } from 'react-router-dom';
import appState from '../../AppState';
import { useAuthContext } from '../../authentication/auth-provider/AuthProvider';
import { getVersion } from '../../axiosAPIs/miscAPI';
import {
  getExplorePathWithSearch,
  getTeamAndUserDetailsPath,
  getUserPath,
  navLinkSettings,
  ROUTES,
  TERM_ADMIN,
  TERM_USER,
} from '../../constants/constants';
import {
  urlGitbookDocs,
  urlGithubRepo,
  urlJoinSlack,
} from '../../constants/url.const';
import { useAuth } from '../../hooks/authHooks';
import jsonData from '../../jsons/en';
import {
  addToRecentSearched,
  getNonDeletedTeams,
} from '../../utils/CommonUtils';
import { prepareQueryParams } from '../../utils/FilterUtils';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import { Filter } from '../AdvanceSearch/AdvanceSearch.interface';
import { COOKIE_VERSION } from '../Modals/WhatsNewModal/whatsNewData';
import NavBar from '../nav-bar/NavBar';

const cookieStorage = new CookieStorage();

const Appbar: React.FC = (): JSX.Element => {
  const location = useLocation();
  const history = useHistory();
  const { isFirstTimeUser } = useAuth(location.pathname);
  const {
    isAuthDisabled,
    isAuthenticated,
    isProtectedRoute,
    isTourRoute,
    onLogoutHandler,
  } = useAuthContext();
  const match: Match | null = useRouteMatch({
    path: ROUTES.EXPLORE_WITH_SEARCH,
  });
  const searchQuery = match?.params?.searchQuery;
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState<boolean>(false);

  const [version, setVersion] = useState<string>('');

  const [advanceFilters, setAdvanceFilters] = useState<Array<Filter>>([]);

  const handleFeatureModal = (value: boolean) => {
    setIsFeatureModalOpen(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const onFilterUpdate = (filters: Array<Filter>) => {
    setAdvanceFilters(filters);
  };

  const supportLinks = [
    {
      name: (
        <span>
          <span className="tw-text-grey-muted">{`Version ${
            (version ? version : '?').split('-')[0]
          }`}</span>
        </span>
      ),
      to: urlGithubRepo,
      isOpenNewTab: true,
      disabled: false,
      icon: (
        <SVGIcons
          alt="Version icon"
          className="tw-align-middle tw--mt-0.5 tw-mr-0.5"
          icon={Icons.VERSION_BLACK}
          width="12"
        />
      ),
    },
    {
      name: `Docs`,
      to: urlGitbookDocs,
      isOpenNewTab: true,
      disabled: false,
      icon: (
        <SVGIcons
          alt="Doc icon"
          className="tw-align-middle tw--mt-0.5 tw-mr-0.5"
          icon={Icons.DOC}
          width="12"
        />
      ),
    },
    {
      name: `API`,
      to: ROUTES.SWAGGER,
      disabled: false,
      icon: (
        <SVGIcons
          alt="API icon"
          className="tw-align-middle tw--mt-0.5 tw-mr-0.5"
          icon={Icons.API}
          width="12"
        />
      ),
    },
    {
      name: `Slack`,
      to: urlJoinSlack,
      disabled: false,
      isOpenNewTab: true,
      icon: (
        <SVGIcons
          alt="slack icon"
          className="tw-align-middle tw-mr-0.5"
          icon={Icons.SLACK_GREY}
          width="12"
        />
      ),
    },
  ];

  const getUserName = () => {
    const currentUser = isAuthDisabled
      ? appState.nonSecureUserDetails
      : appState.userDetails;

    return currentUser?.displayName || currentUser?.name || TERM_USER;
  };

  const getUserData = () => {
    const currentUser = isAuthDisabled
      ? appState.nonSecureUserDetails
      : appState.userDetails;

    const name = currentUser?.displayName || currentUser?.name || TERM_USER;

    const roles = currentUser?.roles?.map((r) => r.displayName) || [];
    const inheritedRoles =
      currentUser?.inheritedRoles?.map((r) => r.displayName) || [];

    currentUser?.isAdmin && roles.unshift(TERM_ADMIN);

    const teams = getNonDeletedTeams(currentUser?.teams ?? []);

    return (
      <div data-testid="greeting-text">
        <Link to={getUserPath(currentUser?.name as string)}>
          {' '}
          <span className="tw-font-medium tw-cursor-pointer">{name}</span>
        </Link>
        <hr className="tw-my-1.5" />
        {roles.length > 0 ? (
          <div>
            <div className="tw-font-medium tw-text-xs">Roles</div>
            {roles.map((r, i) => (
              <p className="tw-text-grey-muted" key={i}>
                {r}
              </p>
            ))}
            <hr className="tw-my-1.5" />
          </div>
        ) : null}
        {inheritedRoles.length > 0 ? (
          <div>
            <div className="tw-font-medium tw-text-xs">Inherited Roles</div>
            {inheritedRoles.map((inheritedRole, i) => (
              <p className="tw-text-grey-muted" key={i}>
                {inheritedRole}
              </p>
            ))}
            <hr className="tw-my-1.5" />
          </div>
        ) : null}
        {teams.length > 0 ? (
          <div>
            <span className="tw-font-medium tw-text-xs">Teams</span>
            {teams.map((t, i) => (
              <p key={i}>
                <Link to={getTeamAndUserDetailsPath(t.name as string)}>
                  {t.displayName || t.name}
                </Link>
              </p>
            ))}
            <hr className="tw-mt-1.5" />
          </div>
        ) : null}
      </div>
    );
  };

  const profileDropdown = [
    {
      name: getUserData(),
      to: '',
      disabled: false,
      icon: <></>,
      isText: true,
    },
    {
      name: 'Logout',
      to: '',
      disabled: false,
      method: onLogoutHandler,
    },
  ];

  const prepareSearchString = () => {
    const filterObject = advanceFilters.reduce((filterObj, item) => {
      if (item.value) {
        return { ...filterObj, [item.key]: item.value.split(',') };
      } else {
        return filterObj;
      }
    }, {});

    return prepareQueryParams(filterObject, filterObject);
  };

  const searchHandler = (value: string) => {
    setIsOpen(false);
    addToRecentSearched(value);
    const explorePath = getExplorePathWithSearch(
      value,
      // this is for if user is searching from another page
      location.pathname.startsWith(ROUTES.EXPLORE)
        ? appState.explorePageTab
        : 'tables'
    );

    history.push({
      pathname: explorePath,
      search: prepareSearchString(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    if (e.key === 'Enter') {
      searchHandler(target.value);
    }
  };

  const handleOnclick = () => {
    searchHandler(searchValue ?? '');
  };

  const fetchOMVersion = () => {
    getVersion()
      .then((res: AxiosResponse) => {
        setVersion(res.data.version);
      })
      .catch((err: AxiosError) => {
        showErrorToast(
          err,
          jsonData['api-error-messages']['fetch-version-error']
        );
      });
  };

  useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setIsFeatureModalOpen(
      // TODO: Add !isFirstTimeUser to condition if showing Welcome Modal
      cookieStorage.getItem(COOKIE_VERSION) !== 'true'
    );
  }, [isFirstTimeUser]);

  useEffect(() => {
    if (isAuthDisabled) {
      fetchOMVersion();
    } else {
      if (!isEmpty(appState.userDetails)) {
        fetchOMVersion();
      }
    }
  }, [appState.userDetails, isAuthDisabled]);

  return (
    <>
      {isProtectedRoute(location.pathname) &&
      (isAuthDisabled || isAuthenticated) &&
      !isTourRoute(location.pathname) ? (
        <NavBar
          handleFeatureModal={handleFeatureModal}
          handleKeyDown={handleKeyDown}
          handleOnClick={handleOnclick}
          handleSearchBoxOpen={setIsOpen}
          handleSearchChange={handleSearchChange}
          isFeatureModalOpen={isFeatureModalOpen}
          isSearchBoxOpen={isOpen}
          pathname={location.pathname}
          profileDropdown={profileDropdown}
          searchValue={searchValue || ''}
          settingDropdown={navLinkSettings}
          supportDropdown={supportLinks}
          username={getUserName()}
          onFilterUpdate={onFilterUpdate}
        />
      ) : null}
    </>
  );
};

export default observer(Appbar);
