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

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import ManageButton from './ManageButton';

jest.mock('../../../../utils/AnnouncementsUtils', () => ({
  ANNOUNCEMENT_ENTITIES: ['table', 'topic', 'dashboard', 'pipeline'],
}));

jest.mock('../../DeleteWidget/DeleteWidgetModal', () => {
  return jest.fn().mockReturnValue(<div>DeleteWidgetModal</div>);
});

const mockAnnouncementClick = jest.fn();

const mockProps = {
  allowSoftDelete: true,
  entityName: 'string',
  entityId: 'string-id',
  entityType: 'table',
  entityFQN: 'x.y.z',
  isRecursiveDelete: true,
  deleteMessage: 'string',
  onAnnouncementClick: mockAnnouncementClick,
};

describe('Test manage button component', () => {
  it('Should render manage button component', async () => {
    render(<ManageButton {...mockProps} />);

    const manageButton = await screen.findByTestId('manage-button');

    expect(manageButton).toBeInTheDocument();
  });

  it('Should render dropdown component on click of manage button', async () => {
    render(<ManageButton {...mockProps} />);

    const manageButton = await screen.findByTestId('manage-button');

    expect(manageButton).toBeInTheDocument();

    fireEvent.click(manageButton);

    const deleteOption = await screen.findByTestId('delete-button');
    const announcementOption = await screen.findByTestId('announcement-button');

    expect(deleteOption).toBeInTheDocument();
    expect(announcementOption).toBeInTheDocument();
  });

  it('Should render delete modal component on click of delete option', async () => {
    render(<ManageButton {...mockProps} canDelete />);

    const manageButton = await screen.findByTestId('manage-button');

    expect(manageButton).toBeInTheDocument();

    fireEvent.click(manageButton);

    const deleteOption = await screen.findByTestId('delete-button');

    expect(deleteOption).toBeInTheDocument();

    fireEvent.click(deleteOption);

    expect(await screen.findByText('DeleteWidgetModal')).toBeInTheDocument();
  });

  it('Should call announcement callback on click of announcement option', async () => {
    render(<ManageButton {...mockProps} />);

    const manageButton = await screen.findByTestId('manage-button');

    expect(manageButton).toBeInTheDocument();

    fireEvent.click(manageButton);

    const announcementOption = await screen.findByTestId('announcement-button');

    expect(announcementOption).toBeInTheDocument();

    fireEvent.click(announcementOption);

    expect(mockAnnouncementClick).toBeCalled();
  });
});
