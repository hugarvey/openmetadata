/*
 *  Copyright 2024 Collate.
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

import { Page } from '@playwright/test';
import { uuid } from '../../../utils/common';
import {
  checkServiceFieldSectionHighlighting,
  Services,
} from '../../../utils/serviceIngestion';
import ServiceBaseClass from './ServiceBaseClass';

class S3IngestionClass extends ServiceBaseClass {
  name: string;
  constructor() {
    super(
      Services.Storage,
      `pw-s3-storage-${uuid()}`,
      'S3',
      'om-cypress-bucket'
    );
  }

  async createService(page: Page) {
    super.createService(page);
  }

  async updateService(page: Page) {
    super.updateService(page);
  }

  async fillConnectionDetails(page: Page) {
    const s3StorageAccessKeyId =
      process.env.PLAYWRIGHT_S3_STORAGE_ACCESS_KEY_ID ?? '';
    const s3StorageSecretAccessKey =
      process.env.PLAYWRIGHT_S3_STORAGE_SECRET_ACCESS_KEY ?? '';

    await page.fill('#root\\/awsConfig\\/awsAccessKeyId', s3StorageAccessKeyId);
    await checkServiceFieldSectionHighlighting(page, 'awsAccessKeyId');
    await page.fill(
      '#root\\/awsConfig\\/awsSecretAccessKey',
      s3StorageSecretAccessKey
    );
    await checkServiceFieldSectionHighlighting(page, 'awsSecretAccessKey');
    await page.fill('#root\\/awsConfig\\/awsRegion', 'us-east-2');
    await checkServiceFieldSectionHighlighting(page, 'awsRegion');
  }

  async fillIngestionDetails(page: Page) {
    await page.fill(
      '#root\\/containerFilterPattern\\/includes',
      `${this.entityName}`
    );
    await page
      .locator('#root\\/containerFilterPattern\\/includes')
      .press('Enter');
  }

  async deleteService(page: Page): Promise<void> {
    await super.deleteService(page);
  }
}

export default S3IngestionClass;
