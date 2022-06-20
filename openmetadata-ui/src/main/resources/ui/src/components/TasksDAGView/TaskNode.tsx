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
import React, { CSSProperties, Fragment } from 'react';
import { Handle, HandleType, NodeProps, Position } from 'react-flow-renderer';

const handleStyles = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  position: 'absolute',
  top: 10,
};

const renderHandle = (
  position: Position,
  styles: CSSProperties,
  type: HandleType
) => {
  return (
    <Handle isConnectable position={position} style={styles} type={type} />
  );
};

const getHandle = (nodeType: string) => {
  if (nodeType === 'output') {
    return renderHandle(
      Position.Left,
      { ...handleStyles, left: '-14px' } as CSSProperties,
      'target'
    );
  } else if (nodeType === 'input') {
    return renderHandle(
      Position.Right,
      { ...handleStyles, right: '-14px' } as CSSProperties,
      'source'
    );
  } else {
    return (
      <Fragment>
        {renderHandle(
          Position.Left,
          { ...handleStyles, left: '-14px' } as CSSProperties,
          'target'
        )}
        {renderHandle(
          Position.Right,
          { ...handleStyles, right: '-14px' } as CSSProperties,
          'source'
        )}
      </Fragment>
    );
  }
};

const TaskNode = (props: NodeProps) => {
  const { data, type } = props;
  const { label } = data;

  return (
    <div className="tw-relative nowheel ">
      {getHandle(type)}
      {/* Node label could be simple text or reactNode */}
      <div className={classNames('tw-px-2')} data-testid="node-label">
        {label}
      </div>
    </div>
  );
};

export default TaskNode;
