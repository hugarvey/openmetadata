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
import { capitalize, isEmpty, uniqueId, upperCase } from 'lodash';
import React, { FC, HTMLAttributes } from 'react';
import { FlowElement } from 'react-flow-renderer';
import { EntityType } from '../../enums/entity.enum';
import SVGIcons from '../../utils/SvgUtils';

interface SidebarProps extends HTMLAttributes<HTMLDivElement> {
  show: boolean;
  newAddedNode?: FlowElement;
}

interface EntityNodeProps extends HTMLAttributes<HTMLDivElement> {
  type: string;
  label: string;
}

const entityData = [
  {
    type: EntityType.TABLE,
    label: capitalize(EntityType.TABLE),
  },
  { type: EntityType.PIPELINE, label: capitalize(EntityType.PIPELINE) },
  { type: EntityType.DASHBOARD, label: capitalize(EntityType.DASHBOARD) },
];

const EntityNode: FC<EntityNodeProps> = ({ type, label, draggable }) => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="tw-flex tw-flex-col tw-mb-3 tw-items-center">
      <div
        className={classNames(
          'tw-border tw-p-2 tw-border-main tw-flex tw-justify-between tw-w-16 tw-rounded',
          {
            'tw-cursor-not-allowed tw-opacity-50': !draggable,
          }
        )}
        draggable={draggable}
        style={{ ...(draggable && { cursor: 'grab' }) }}
        onDragStart={(event) => onDragStart(event, `${label}-default`)}>
        <span
          onDragStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          <SVGIcons alt={type} icon={type} width="14" />
        </span>
        <span>
          <i className="fas fa-grip-vertical" style={{ color: '#B3B3B3' }} />
        </span>
      </div>
      <p className="tw-text-primary tw-text-center tw-text-xs">
        {upperCase(`${label}s`)}
      </p>
    </div>
  );
};

const EntityLineageSidebar: FC<SidebarProps> = ({ show, newAddedNode }) => {
  return (
    <div className={classNames('entity-lineage sidebar', { open: show })}>
      <div className="tw-flex tw-flex-col tw-mt-3">
        {entityData.map((d) => (
          <EntityNode
            draggable={isEmpty(newAddedNode)}
            key={uniqueId()}
            label={d.label}
            type={d.type}
          />
        ))}
      </div>
    </div>
  );
};

export default EntityLineageSidebar;
