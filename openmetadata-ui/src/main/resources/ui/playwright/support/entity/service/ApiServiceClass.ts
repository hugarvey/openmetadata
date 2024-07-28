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
import { APIRequestContext, Page } from '@playwright/test';
import { SERVICE_TYPE } from '../../../constant/service';
import { uuid } from '../../../utils/common';
import { visitServiceDetailsPage } from '../../../utils/service';
import { EntityTypeEndpoint } from '../Entity.interface';
import { EntityClass } from '../EntityClass';

export class ApiServiceClass extends EntityClass {
  entity = {
    name: `pw-api-service-${uuid()}`,
    serviceType: 'REST',
    connection: {
      config: {
        type: 'REST',
        openAPISchemaURL: 'https://sandbox-beta.open-metadata.org/swagger.json',
      },
    },
  };

  entityResponseData: unknown;

  constructor(name?: string) {
    super(EntityTypeEndpoint.ApiService);
    this.entity.name = name ?? this.entity.name;
    this.type = 'Api Service';
  }

  async create(apiContext: APIRequestContext) {
    const serviceResponse = await apiContext.post(
      '/api/v1/services/apiServices',
      {
        data: this.entity,
      }
    );

    const service = await serviceResponse.json();

    this.entityResponseData = service;

    return service;
  }

  get() {
    return this.entityResponseData;
  }

  async visitEntityPage(page: Page) {
    await visitServiceDetailsPage(
      page,
      {
        name: this.entity.name,
        type: SERVICE_TYPE.ApiService,
      },
      false
    );
  }

  async delete(apiContext: APIRequestContext) {
    const serviceResponse = await apiContext.delete(
      `/api/v1/services/apiServices/name/${encodeURIComponent(
        this.entityResponseData?.['fullyQualifiedName']
      )}?recursive=true&hardDelete=true`
    );

    return await serviceResponse.json();
  }
}
