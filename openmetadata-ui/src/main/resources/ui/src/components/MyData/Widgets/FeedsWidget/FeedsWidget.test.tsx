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
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import FeedsWidget from './FeedsWidget.component';

const mockHandleRemoveWidget = jest.fn();

const mockThread = [
  {
    id: '33873393-bd68-46e9-bccc-7701c1c41ad6',
    type: 'Task',
    threadTs: 1703570590556,
    about: 'test',
    entityId: '6206a003-281c-4984-9728-4e949a4e4023',
    posts: [
      {
        id: '12345',
        message: 'Resolved the Task.',
        postTs: 1703570590652,
        from: 'admin',
        reactions: [],
      },
    ],
    task: {
      id: 6,
      type: 'RequestTestCaseFailureResolution',
      assignees: [
        {
          id: '2345rt',
          type: 'user',
          name: 'aaron_johnson0',
          fullyQualifiedName: 'aaron_johnson0',
          displayName: 'Aaron Johnson',
          deleted: false,
        },
      ],
      status: 'Closed',
      closedBy: 'admin',
      closedAt: 1703570590648,
      newValue: 'Resolution comment',
      testCaseResolutionStatusId: 'f93d08e9-2d38-4d01-a294-f8b44fbb0f4a',
    },
  },
];

const mockUseActivityFeedProviderValue = {
  entityPaging: { total: 4 },
  entityThread: mockThread,
  getFeedData: jest.fn().mockImplementation(() => Promise.resolve()),
  loading: false,
  selectedThread: mockThread[0],
  setActiveThread: jest.fn(),
};

const widgetProps = {
  selectedGridSize: 10,
  isEditView: true,
  widgetKey: 'testWidgetKey',
  handleRemoveWidget: mockHandleRemoveWidget,
};

const tabs = ['All', 'Mentions', 'Tasks'];

jest.mock(
  '../../../ActivityFeed/ActivityFeedList/ActivityFeedListV1.component',
  () => jest.fn().mockImplementation(({ children }) => <p>{children}</p>)
);

jest.mock(
  '../../../common/FeedsFilterPopover/FeedsFilterPopover.component',
  () => jest.fn().mockImplementation(({ children }) => <p>{children}</p>)
);

jest.mock('../../../../rest/feedsAPI', () => ({
  getFeedsWithFilter: jest.fn().mockReturnValue(Promise.resolve(mockThread)),
}));

jest.mock('../../../../utils/CommonUtils', () => ({
  getCountBadge: jest.fn(),
  getEntityDetailLink: jest.fn(),
  Transi18next: jest.fn(),
}));

jest.mock('quilljs-markdown', () => {
  class MockQuillMarkdown {
    constructor() {
      // eslint-disable-next-line no-console
      console.log('Markdown constructor');
    }
  }

  const instance = new MockQuillMarkdown();

  return instance;
});

jest.mock(
  '../../../ActivityFeed/ActivityFeedProvider/ActivityFeedProvider',
  () => ({
    useActivityFeedProvider: jest
      .fn()
      .mockImplementation(() => mockUseActivityFeedProviderValue),
  })
);

describe('FeedsWidget', () => {
  it('should render FeedsWidget', async () => {
    await act(async () => {
      render(<FeedsWidget {...widgetProps} />);
    });
    const activityFeedWidget = screen.getByTestId('activity-feed-widget');

    expect(activityFeedWidget).toBeInTheDocument();
  });

  it('should render All tab by default', () => {
    const { getAllByRole } = render(<FeedsWidget {...widgetProps} />);
    const tabs = getAllByRole('tab');
    const allTab = tabs[0];

    expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  tabs.map((tab, index) => {
    it(`should select ${tab} tab`, () => {
      const { getAllByRole } = render(<FeedsWidget {...widgetProps} />);
      const tabs = getAllByRole('tab');
      const selectedTab = tabs[index];
      fireEvent.click(selectedTab);

      expect(selectedTab.getAttribute('aria-selected')).toBe('true');
    });
  });

  it('should handle close click when in edit view', () => {
    const { getByTestId } = render(<FeedsWidget {...widgetProps} />);
    const closeButton = getByTestId('remove-widget-button');
    fireEvent.click(closeButton);

    expect(mockHandleRemoveWidget).toHaveBeenCalledWith(widgetProps.widgetKey);
  });
});
