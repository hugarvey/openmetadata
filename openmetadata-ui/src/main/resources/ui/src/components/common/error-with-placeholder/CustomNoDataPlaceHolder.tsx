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

import classNames from 'classnames';
import React from 'react';
import { NoDataPlaceholderProps } from './placeholder.interface';

import { ReactComponent as NoDataFoundPlaceHolderIcon } from '../../../assets/svg/no-data-placeholder.svg';

const CustomNoDataPlaceHolder = ({
  size,
  className,
  children,
  icon,
}: NoDataPlaceholderProps) => {
  return (
    <div
      className={classNames(className, 'flex-center flex-col w-full h-full')}
      data-testid="no-data-placeholder">
      {icon ? (
        icon
      ) : (
        <NoDataFoundPlaceHolderIcon
          data-testid="no-data-image"
          height={size}
          width={size}
        />
      )}

      <div className="m-t-xs text-center text-sm font-normal">
        {children ? children : ''}
      </div>
    </div>
  );
};

export default CustomNoDataPlaceHolder;
