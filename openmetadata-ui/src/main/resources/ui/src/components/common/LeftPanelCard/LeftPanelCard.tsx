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

import { Card } from 'antd';
import { lowerCase } from 'lodash';
import React, { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactElement | string;
  id: string;
  classes?: string;
}

const LeftPanelCard = ({ children, id, classes }: CardProps) => {
  return (
    <Card
      className={`${classes} left-panel-card tw-h-full page-layout-v1-left-panel  page-layout-v1-vertical-scroll`}
      data-testid={`${lowerCase(id)}-left-panel`}>
      <div>{children}</div>
    </Card>
  );
};

export default LeftPanelCard;
