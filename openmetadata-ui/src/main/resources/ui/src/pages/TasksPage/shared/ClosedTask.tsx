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

import classNames from 'classnames';
import UserPopOverCard from 'components/common/PopOverCard/UserPopOverCard';
import ProfilePicture from 'components/common/ProfilePicture/ProfilePicture';
import { t } from 'i18next';
import { toLower } from 'lodash';
import React, { FC } from 'react';
import { Thread } from '../../../generated/entity/feed/thread';
import { getDayTimeByTimeStamp } from '../../../utils/TimeUtils';

interface ClosedTaskProps {
  task: Thread['task'];
  className?: string;
}

const ClosedTask: FC<ClosedTaskProps> = ({ task, className }) => {
  return (
    <div className={classNames(className, 'd-flex')} data-testid="task-closed">
      <UserPopOverCard userName={task?.closedBy || ''}>
        <span className="d-flex">
          <ProfilePicture
            displayName={task?.closedBy}
            id=""
            name={task?.closedBy || ''}
            type="circle"
            width="24"
          />
          <span
            className="tw-font-semibold tw-cursor-pointer hover:tw-underline tw-ml-1"
            data-testid="task-closedby">
            {task?.closedBy}
          </span>{' '}
        </span>
      </UserPopOverCard>
      <span className="tw-ml-1"> {t('label.closed-this-task-lowercase')} </span>
      <span className="tw-ml-1" data-testid="task-closedAt">
        {toLower(getDayTimeByTimeStamp(task?.closedAt as number))}
      </span>
    </div>
  );
};

export default ClosedTask;
