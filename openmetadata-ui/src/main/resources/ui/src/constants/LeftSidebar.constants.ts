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

import i18next from 'i18next';
import { ReactComponent as GovernIcon } from '../assets/svg/bank.svg';
import { ReactComponent as ClassificationIcon } from '../assets/svg/classification.svg';
import { ReactComponent as ExploreIcon } from '../assets/svg/globalsearch.svg';
import { ReactComponent as GlossaryIcon } from '../assets/svg/glossary.svg';
import { ReactComponent as AlertIcon } from '../assets/svg/ic-alert.svg';
import { ReactComponent as DataQualityIcon } from '../assets/svg/ic-data-contract.svg';
import { ReactComponent as DomainsIcon } from '../assets/svg/ic-domain.svg';
import { ReactComponent as IncidentMangerIcon } from '../assets/svg/ic-incident-manager.svg';
import { ReactComponent as ObservabilityIcon } from '../assets/svg/ic-observability.svg';
import { ReactComponent as SettingsIcon } from '../assets/svg/ic-settings-v1.svg';
import { ReactComponent as InsightsIcon } from '../assets/svg/lampcharge.svg';
import { ReactComponent as LogoutIcon } from '../assets/svg/logout.svg';

import { SidebarItem } from '../enums/sidebar.enum';
import { getDataInsightPathWithFqn } from '../utils/DataInsightUtils';
import { ROUTES } from './constants';

export const SIDEBAR_LIST = [
  {
    key: ROUTES.EXPLORE,
    label: i18next.t('label.explore'),
    redirect_url: '/explore/tables',
    icon: ExploreIcon,
    dataTestId: `app-bar-item-${SidebarItem.EXPLORE}`,
  },
  {
    key: ROUTES.OBSERVABILITY,
    label: i18next.t('label.observability'),
    icon: ObservabilityIcon,
    dataTestId: SidebarItem.OBSERVABILITY,
    children: [
      {
        key: ROUTES.DATA_QUALITY,
        label: i18next.t('label.data-quality'),
        redirect_url: ROUTES.DATA_QUALITY,
        icon: DataQualityIcon,
        dataTestId: `app-bar-item-${SidebarItem.DATA_QUALITY}`,
      },
      {
        key: ROUTES.INCIDENT_MANAGER,
        label: i18next.t('label.incident-manager'),
        redirect_url: ROUTES.INCIDENT_MANAGER,
        icon: IncidentMangerIcon,
        dataTestId: `app-bar-item-${SidebarItem.INCIDENT_MANAGER}`,
        isBeta: true,
      },
      {
        key: ROUTES.OBSERVABILITY,
        label: i18next.t('label.alert-plural'),
        icon: AlertIcon,
        dataTestId: `app-bar-item-${SidebarItem.OBSERVABILITY_ALERT}`,
      },
    ],
  },
  {
    key: ROUTES.DATA_INSIGHT,
    label: i18next.t('label.insight-plural'),
    redirect_url: getDataInsightPathWithFqn(),
    icon: InsightsIcon,
    dataTestId: `app-bar-item-${SidebarItem.DATA_INSIGHT}`,
  },
  {
    key: ROUTES.DOMAIN,
    label: i18next.t('label.domain-plural'),
    redirect_url: ROUTES.DOMAIN,
    icon: DomainsIcon,
    dataTestId: `app-bar-item-${SidebarItem.DOMAIN}`,
  },
  {
    key: 'governance',
    label: i18next.t('label.govern'),
    icon: GovernIcon,
    dataTestId: SidebarItem.GOVERNANCE,
    children: [
      {
        key: ROUTES.GLOSSARY,
        label: i18next.t('label.glossary'),
        redirect_url: ROUTES.GLOSSARY,
        icon: GlossaryIcon,
        dataTestId: `app-bar-item-${SidebarItem.GLOSSARY}`,
      },
      {
        key: ROUTES.TAGS,
        label: i18next.t('label.classification'),
        redirect_url: ROUTES.TAGS,
        icon: ClassificationIcon,
        dataTestId: `app-bar-item-${SidebarItem.TAGS}`,
      },
    ],
  },
];

export const SETTING_ITEM = {
  key: ROUTES.SETTINGS,
  label: i18next.t('label.setting-plural'),
  redirect_url: ROUTES.SETTINGS,
  icon: SettingsIcon,
  dataTestId: `app-bar-item-${SidebarItem.SETTINGS}`,
};

export const LOGOUT_ITEM = {
  key: 'logout',
  label: i18next.t('label.logout'),
  icon: LogoutIcon,
  dataTestId: `app-bar-item-${SidebarItem.LOGOUT}`,
};
