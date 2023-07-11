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

import { render, screen } from '@testing-library/react';
import { TagOption } from 'Models';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Column } from '../../generated/api/data/createTable';
import { Table } from '../../generated/entity/data/table';
import EntityTableV1 from './EntityTable.component';

const onEntityFieldSelect = jest.fn();
const onThreadLinkSelect = jest.fn();
const onUpdate = jest.fn();

const mockTableConstraints = [
  {
    constraintType: 'PRIMARY_KEY',
    columns: ['address_id', 'shop_id'],
  },
] as Table['tableConstraints'];

const mockEntityTableProp = {
  tableColumns: [
    {
      name: 'comments',
      dataType: 'STRING',
      dataLength: 1,
      dataTypeDisplay: 'string',
      fullyQualifiedName:
        'bigquery_gcp.ecommerce.shopify.raw_product_catalog.comments',
      tags: [],
      constraint: 'NULL',
      ordinalPosition: 1,
    },
    {
      name: 'products',
      dataType: 'ARRAY',
      arrayDataType: 'STRUCT',
      dataLength: 1,
      dataTypeDisplay:
        'array<struct<product_id:character varying(24),price:int,onsale:boolean,tax:int,weight:int,others:int,vendor:character varying(64), stock:int>>',
      fullyQualifiedName:
        'bigquery_gcp.ecommerce.shopify.raw_product_catalog.products',
      tags: [],
      constraint: 'NULL',
      ordinalPosition: 2,
    },
    {
      name: 'platform',
      dataType: 'STRING',
      dataLength: 1,
      dataTypeDisplay: 'string',
      fullyQualifiedName:
        'bigquery_gcp.ecommerce.shopify.raw_product_catalog.platform',
      tags: [],
      constraint: 'NULL',
      ordinalPosition: 3,
    },
    {
      name: 'store_address',
      dataType: 'ARRAY',
      arrayDataType: 'STRUCT',
      dataLength: 1,
      dataTypeDisplay:
        'array<struct<name:character varying(32),street_address:character varying(128),city:character varying(32),postcode:character varying(8)>>',
      fullyQualifiedName:
        'bigquery_gcp.ecommerce.shopify.raw_product_catalog.store_address',
      tags: [],
      constraint: 'NULL',
      ordinalPosition: 4,
    },
    {
      name: 'first_order_date',
      dataType: 'TIMESTAMP',
      dataTypeDisplay: 'timestamp',
      description:
        'The date (ISO 8601) and time (UTC) when the customer placed their first order. The format is YYYY-MM-DD HH:mm:ss (for example, 2016-02-05 17:04:01).',
      fullyQualifiedName:
        'bigquery_gcp.ecommerce.shopify.raw_product_catalog.first_order_date',
      tags: [],
      ordinalPosition: 5,
    },
    {
      name: 'last_order_date',
      dataType: 'TIMESTAMP',
      dataTypeDisplay: 'timestamp',
      description:
        'The date (ISO 8601) and time (UTC) when the customer placed their most recent order. The format is YYYY-MM-DD HH:mm:ss (for example, 2016-02-05 17:04:01).',
      fullyQualifiedName:
        'bigquery_gcp.ecommerce.shopify.raw_product_catalog.last_order_date',
      tags: [],
      ordinalPosition: 6,
    },
  ] as Column[],
  searchText: '',
  hasEditAccess: false,
  joins: [],
  entityFieldThreads: [],
  hasDescriptionEditAccess: true,
  isReadOnly: false,
  entityFqn: 'bigquery_gcp.ecommerce.shopify.raw_product_catalog',
  owner: {} as Table['owner'],
  columnName: '',
  hasTagEditAccess: true,
  tableConstraints: mockTableConstraints,
  onEntityFieldSelect,
  onThreadLinkSelect,
  onUpdate,
};

jest.mock('../../hooks/authHooks', () => {
  return {
    useAuth: jest.fn().mockReturnValue({
      userPermissions: jest.fn().mockReturnValue(true),
      isAdminUser: true,
    }),
  };
});

jest.mock('../common/rich-text-editor/RichTextEditorPreviewer', () => {
  return jest.fn().mockReturnValue(<p>RichTextEditorPreviewer</p>);
});

jest.mock('../Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor', () => ({
  ModalWithMarkdownEditor: jest.fn().mockReturnValue(<p>EditorModal</p>),
}));

jest.mock('components/Tag/TagsContainer/tags-container', () => {
  return jest.fn().mockImplementation(({ tagList }) => {
    return (
      <>
        {tagList.map((tag: TagOption, idx: number) => (
          <p key={idx}>{tag.fqn}</p>
        ))}
      </>
    );
  });
});

jest.mock('components/Tag/TagsViewer/tags-viewer', () => {
  return jest.fn().mockReturnValue(<p>TagViewer</p>);
});

jest.mock('components/Tag/Tags/tags', () => {
  return jest.fn().mockReturnValue(<p>Tag</p>);
});

jest.mock('../../utils/TagsUtils', () => ({
  getAllTagsList: jest.fn(() => Promise.resolve([])),
  getTagsHierarchy: jest.fn().mockReturnValue([]),
}));

jest.mock('../../utils/GlossaryUtils', () => ({
  getGlossaryTermsList: jest.fn(() => Promise.resolve([])),
  getGlossaryTermHierarchy: jest.fn().mockReturnValue([]),
}));

jest.mock(
  'components/common/error-with-placeholder/FilterTablePlaceHolder',
  () => {
    return jest.fn().mockReturnValue(<p>FilterTablePlaceHolder</p>);
  }
);

jest.mock('components/TableTags/TableTags.component', () => {
  return jest.fn().mockReturnValue(<p>TableTags</p>);
});

describe('Test EntityTable Component', () => {
  it('Initially, Table should load', async () => {
    render(<EntityTableV1 {...mockEntityTableProp} />, {
      wrapper: MemoryRouter,
    });

    const entityTable = await screen.findByTestId('entity-table');

    expect(entityTable).toBeInTheDocument();
  });

  it('should render request description button', async () => {
    render(<EntityTableV1 {...mockEntityTableProp} />, {
      wrapper: MemoryRouter,
    });

    const entityTable = await screen.findByTestId('entity-table');

    expect(entityTable).toBeInTheDocument();

    const requestDescriptionButton = await screen.findAllByTestId(
      'request-description'
    );

    expect(requestDescriptionButton[0]).toBeInTheDocument();
  });
});
