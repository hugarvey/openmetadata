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

import { uniqueId } from 'lodash';
import React from 'react';

const stepsData = [
  {
    step: 1,
    title: 'Managed Airflow APIs',
    description: `OpenMetadata uses Airflow to run Ingestion Connectors. We developed Managed APIs to deploy ingestion connectors. 
      Please refer to the guide here to use the OpenMetadata Airflow docker container or install the managed APIs in your Airflow installation.`,
    link: 'https://docs.open-metadata.org/integrations/airflow/custom-airflow-installation',
  },
  {
    step: 2,
    title: 'Configure Airflow in the OpenMetadata Server',
    description:
      'Learn how to use the workflow deployment from the UI with a simple configuration.',
    link: 'https://docs.open-metadata.org/integrations/airflow/configure-airflow-in-the-openmetadata-server',
  },
  {
    step: 3,
    title: 'For More Details',
    description: 'Please visit our documentation on Airflow setup.',
    link: 'https://docs.open-metadata.org/integrations/airflow',
  },
];

const ErrorPlaceHolderIngestion = () => {
  const airflowSetupGuide = () => {
    return (
      <div className="tw-mb-5" data-testid="error-steps">
        <div className="tw-mb-3 tw-text-center">
          <p>
            To set up ingestion pipelines, you first need to configure and
            connect to Airflow.
          </p>
        </div>
        <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mt-5">
          {stepsData.map((data) => (
            <div
              className="tw-card tw-flex tw-flex-col tw-justify-between tw-p-5"
              key={uniqueId()}>
              <div>
                <div className="tw-flex tw-mb-2">
                  <div className="tw-rounded-full tw-flex tw-justify-center tw-items-center tw-h-10 tw-w-10 tw-border-2 tw-border-primary tw-text-lg tw-font-bold tw-text-primary">
                    {data.step}
                  </div>
                </div>

                <h6 className="tw-text-base tw-text-grey-body tw-font-medium">
                  {data.title}
                </h6>

                <p className="tw-text-grey-body tw-pb-1 tw-text-sm tw-mb-5">
                  {data.description}
                </p>
              </div>

              <p>
                <a href={data.link} rel="noopener noreferrer" target="_blank">
                  Click here &gt;&gt;
                </a>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="tw-mt-10 tw-text-base tw-font-medium">
      {airflowSetupGuide()}
    </div>
  );
};

export default ErrorPlaceHolderIngestion;
