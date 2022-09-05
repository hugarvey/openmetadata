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

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Select, Space } from 'antd';
import React, { useState } from 'react';
import { TeamType } from '../../../generated/entity/teams/team';
import { TeamTypeSelectProps } from './TeamTypeSelect.interface';
import './TeamTypeSelect.style.less';
import { getTeamTypeOptions } from './TeamTypeSelect.utils';

function TeamTypeSelect({
  handleShowTypeSelector,
  teamType,
  updateTeamType,
}: TeamTypeSelectProps) {
  const [value, setValue] = useState<TeamType>(teamType);

  const handleSelect = (type: TeamType) => {
    setValue(type);
  };

  const handleCancel = () => {
    handleShowTypeSelector(false);
  };

  const handleSubmit = () => {
    updateTeamType && updateTeamType(value);
  };

  return (
    <Space align="center" className="team-type-select" size={4}>
      <Select
        defaultActiveFirstOption
        options={getTeamTypeOptions()}
        value={value}
        onSelect={handleSelect}
      />
      <Space className="edit-team-type-buttons" size={4}>
        <Button
          icon={<FontAwesomeIcon className="tw-w-3.5 tw-h-3.5" icon="xmark" />}
          onClick={handleCancel}
        />
        <Button
          icon={<FontAwesomeIcon className="tw-w-3.5 tw-h-3.5" icon="check" />}
          onClick={handleSubmit}
        />
      </Space>
    </Space>
  );
}

export default TeamTypeSelect;
