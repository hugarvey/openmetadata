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

import React, { FC } from 'react';
import { getEntityName } from '../../../utils/EntityUtils';
import UserPopOverCard from '../PopOverCard/UserPopOverCard';
import { AssigneeListProps, UserTeam } from './AssigneeList.interface';

const AssigneeList: FC<AssigneeListProps> = ({
  assignees,
  showUserName = true,
}) => {
  return (
    <div className="d-flex gap-1 flex-wrap">
      {assignees.map((assignee) => (
        <UserPopOverCard
          displayName={getEntityName(assignee)}
          key={assignee.name}
          showUserName={showUserName}
          type={assignee.type as UserTeam}
          userName={assignee.name ?? ''}
        />
      ))}
    </div>
  );
};

export default AssigneeList;
