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

import { t } from 'i18next';

import { capitalize, upperCase } from 'lodash';
import { INGESTION_ACTION_TYPE } from '../constants/Ingestions.constant';
import { PipelineType } from '../generated/api/services/ingestionPipelines/createIngestionPipeline';

export const getIngestionHeadingName = (
  ingestionType: string,
  type: string
) => {
  let ingestionName = capitalize(ingestionType);
  if (ingestionType === PipelineType.Dbt) {
    ingestionName = upperCase(ingestionType);
  }

  return type === INGESTION_ACTION_TYPE.ADD
    ? t('label.add-workflow-ingestion', {
        workflow: ingestionName,
      })
    : t('label.edit-workflow-ingestion', {
        workflow: ingestionName,
      });
};
