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

import { Progress } from 'antd';
import classNames from 'classnames';
import { round } from 'lodash';
import React from 'react';
import SVGIcons, { Icons } from '../../utils/SvgUtils';
import CustomStatistic from './CustomStatistic';

interface DataInsightProgressBarProps {
  width?: number;
  progress: number;
  className?: string;
  showLabel?: boolean;
  showSuccessInfo?: boolean;
  label?: string;
  target?: number;
  suffix?: string;
  changeInValue?: number;
  duration?: number;
}

const DataInsightProgressBar = ({
  width,
  progress,
  className,
  target,
  label,
  suffix = '%',
  showSuccessInfo = false,
  changeInValue,
  duration,
}: DataInsightProgressBarProps) => {
  return (
    <div
      className={classNames(className)}
      data-testid="progress-bar-container"
      style={{ width }}>
      <CustomStatistic
        changeInValue={changeInValue}
        duration={duration}
        label={label}
        value={`${progress}${suffix}`}
      />

      <div className={classNames('flex', { 'm-t-sm': Boolean(target) })}>
        <Progress
          className="data-insight-progress-bar"
          format={() => (
            <>
              {target && (
                <span
                  className="data-insight-kpi-target"
                  style={{ width: `${target}%` }}>
                  <span className="target-text">
                    {round(target, 2)}
                    {suffix}
                  </span>
                </span>
              )}
            </>
          )}
          percent={progress}
          strokeColor="#B3D4F4"
        />
        {showSuccessInfo && progress >= 100 && (
          <SVGIcons className="m-l-xs" icon={Icons.SUCCESS_BADGE} />
        )}
      </div>
    </div>
  );
};

export default DataInsightProgressBar;
