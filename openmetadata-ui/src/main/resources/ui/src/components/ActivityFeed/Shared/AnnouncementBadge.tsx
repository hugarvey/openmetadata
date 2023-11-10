/*
 *  Copyright 2022 Collate.
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

import { Typography } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as AnnouncementIcon } from '../../../assets/svg/announcements-v1.svg';
import './task-badge.less';

const AnnouncementBadge = () => {
  const { t } = useTranslation();

  return (
    <div className="announcement-badge-container">
      <AnnouncementIcon className="announcement-badge" />

      <Typography.Paragraph className="text-xs m-l-xss m-b-0 text-primary">
        {t('label.announcement')}
      </Typography.Paragraph>
    </div>
  );
};

export default AnnouncementBadge;
