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

import {
  act,
  findAllByTestId,
  findByTestId,
  findByText,
  queryByTestId,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Topic } from '../../../generated/entity/data/topic';
import { MESSAGE_SCHEMA } from '../TopicDetails.mock';
import TopicSchema from './TopicSchema';
import { TopicSchemaFieldsProps } from './TopicSchema.interface';

const mockOnUpdate = jest.fn();

const mockProps: TopicSchemaFieldsProps = {
  messageSchema: MESSAGE_SCHEMA as Topic['messageSchema'],
  hasDescriptionEditAccess: true,
  isReadOnly: false,
  onUpdate: mockOnUpdate,
  hasTagEditAccess: true,
  entityFqn: 'topic.fqn',
  onThreadLinkSelect: jest.fn(),
};

jest.mock('../../../utils/TagsUtils', () => ({
  getAllTagsList: jest.fn().mockImplementation(() => Promise.resolve([])),
  getTagsHierarchy: jest.fn().mockReturnValue([]),
}));

jest.mock('../../../utils/GlossaryUtils', () => ({
  getGlossaryTermHierarchy: jest.fn().mockReturnValue([]),
  getGlossaryTermsList: jest.fn().mockImplementation(() => Promise.resolve([])),
}));

jest.mock('../../common/rich-text-editor/RichTextEditorPreviewer', () =>
  jest
    .fn()
    .mockReturnValue(
      <div data-testid="description-preview">Description Preview</div>
    )
);

jest.mock(
  '../../Modals/ModalWithMarkdownEditor/ModalWithMarkdownEditor',
  () => ({
    ModalWithMarkdownEditor: jest
      .fn()
      .mockReturnValue(<div data-testid="editor-modal">Editor Modal</div>),
  })
);

jest.mock('../../TableTags/TableTags.component', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="table-tag-container">Table Tag Container</div>
    ))
);

jest.mock('../../common/error-with-placeholder/ErrorPlaceHolder', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="error-placeholder">ErrorPlaceHolder</div>
    ))
);

jest.mock('../../schema-editor/SchemaEditor', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="schema-editor">SchemaEditor</div>
    ))
);

describe('Topic Schema', () => {
  it('Should render the schema component', async () => {
    render(<TopicSchema {...mockProps} />);

    const schemaFields = await screen.findByTestId('topic-schema-fields-table');
    const rows = await screen.findAllByRole('row');

    const row1 = rows[1];

    expect(schemaFields).toBeInTheDocument();

    // should render header row and content row
    expect(rows).toHaveLength(20);

    const name = await findByText(row1, 'Order');
    const dataType = await findByText(row1, 'RECORD');
    const description = await findByText(row1, 'Description Preview');
    const tagsContainer = await findAllByTestId(row1, 'table-tag-container');

    expect(name).toBeInTheDocument();
    expect(dataType).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    expect(tagsContainer).toHaveLength(2);
  });

  it('Should render the children on click of expand icon', async () => {
    render(<TopicSchema {...mockProps} />);

    const rows = await screen.findAllByRole('row');

    const nestedRow = rows[1];
    const singleRow = rows[2];

    const expandIcon = await findByTestId(nestedRow, 'expand-icon');

    const singleRowExpandIcon = queryByTestId(singleRow, 'expand-icon');

    expect(expandIcon).toBeInTheDocument();

    // single row should not have the expand icon
    expect(singleRowExpandIcon).toBeNull();

    // order_id is child of nested row, so should be null initially
    expect(await screen.findByText('order_id')).toBeInTheDocument();

    await act(async () => {
      userEvent.click(expandIcon);
    });

    expect(screen.queryByText('order_id')).toBeNull();
  });

  it('On edit description button click modal editor should render', async () => {
    render(<TopicSchema {...mockProps} />);

    const rows = await screen.findAllByRole('row');

    const row1 = rows[1];

    const editDescriptionButton = await findByTestId(row1, 'edit-button');

    expect(editDescriptionButton).toBeInTheDocument();

    await act(async () => {
      userEvent.click(editDescriptionButton);
    });

    expect(await screen.findByTestId('editor-modal')).toBeInTheDocument();
  });

  it('Should not render the edit action if isReadOnly', async () => {
    render(
      <TopicSchema {...mockProps} isReadOnly hasDescriptionEditAccess={false} />
    );

    const rows = await screen.findAllByRole('row');

    const row1 = rows[1];

    const editDescriptionButton = queryByTestId(row1, 'edit-button');

    expect(editDescriptionButton).toBeNull();
  });
});
