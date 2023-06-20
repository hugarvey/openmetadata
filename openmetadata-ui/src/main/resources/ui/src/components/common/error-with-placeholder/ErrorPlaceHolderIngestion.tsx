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

import { Card, Typography } from 'antd';
import { AIRFLOW_DOCS } from 'constants/docs.constants';
import { PIPELINE_SERVICE_PLATFORM } from 'constants/Services.constant';
import { useAirflowStatus } from 'hooks/useAirflowStatus';
import { t } from 'i18next';
import React from 'react';
import AirflowMessageBanner from '../AirflowMessageBanner/AirflowMessageBanner';

const ErrorPlaceHolderIngestion = () => {
  const { platform } = useAirflowStatus();

  const isAirflowPlatform = platform === PIPELINE_SERVICE_PLATFORM;

  const airflowSetupGuide = () => {
    return (
      <div className="tw-mb-5" data-testid="error-steps">
        <Card className="d-flex flex-col tw-justify-between tw-p-5 tw-w-4/5 tw-mx-auto">
          <AirflowMessageBanner className="m-b-xs" />
          {isAirflowPlatform ? (
            <>
              <div>
                <h6 className="tw-text-base tw-text-grey-body tw-font-medium">
                  {t('message.manage-airflow-api-failed')}
                </h6>

                <p className="tw-text-grey-body tw-text-sm tw-mb-5">
                  {t('message.airflow-guide-message')}
                </p>
              </div>

              <p>
                <a
                  href={AIRFLOW_DOCS}
                  rel="noopener noreferrer"
                  target="_blank">
                  {`${t('label.install-airflow-api')} >>`}
                </a>
              </p>
            </>
          ) : (
            <>
              <Typography>{t('message.pipeline-scheduler-message')}</Typography>
            </>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="tw-mt-5 tw-text-base tw-font-medium">
      {airflowSetupGuide()}
    </div>
  );
};

export default ErrorPlaceHolderIngestion;
