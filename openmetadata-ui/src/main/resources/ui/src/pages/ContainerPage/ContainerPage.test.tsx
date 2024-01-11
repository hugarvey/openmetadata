/*
 *  Copyright 2023 Collate.
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
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { ReactNode } from 'react';
import { ERROR_PLACEHOLDER_TYPE } from '../../enums/common.enum';
import { addContainerFollower } from '../../rest/storageAPI';
import ContainerPage from './ContainerPage';
import { CONTAINER_DATA } from './ContainerPage.mock';

const mockGetEntityPermissionByFqn = jest.fn().mockResolvedValue({
  ViewBasic: true,
});
const mockGetContainerByName = jest.fn().mockResolvedValue(CONTAINER_DATA);

jest.mock(
  '../../components/ActivityFeed/ActivityFeedProvider/ActivityFeedProvider',
  () => ({
    useActivityFeedProvider: jest.fn().mockImplementation(() => ({
      postFeed: jest.fn(),
      deleteFeed: jest.fn(),
      updateFeed: jest.fn(),
    })),
    __esModule: true,
    default: (props: { children: ReactNode }) => (
      <div data-testid="activity-feed-provider">{props.children}</div>
    ),
  })
);

jest.mock(
  '../../components/ActivityFeed/ActivityFeedTab/ActivityFeedTab.component',
  () => ({
    ActivityFeedTab: jest.fn().mockReturnValue(<>ActivityFeedTab</>),
  })
);

jest.mock(
  '../../components/ActivityFeed/ActivityThreadPanel/ActivityThreadPanel',
  () => jest.fn().mockImplementation(() => <>ActivityThreadPanel</>)
);

jest.mock('../../components/Auth/AuthProviders/AuthProvider', () => ({
  useAuthContext: jest.fn().mockReturnValue({
    id: 'userid',
  }),
}));

jest.mock(
  '../../components/common/CustomPropertyTable/CustomPropertyTable',
  () => ({
    CustomPropertyTable: jest.fn().mockReturnValue(<>CustomPropertyTable</>),
  })
);

jest.mock('../../components/common/EntityDescription/DescriptionV1', () =>
  jest
    .fn()
    .mockImplementation(({ onThreadLinkSelect }) => (
      <button onClick={onThreadLinkSelect}>DescriptionV1</button>
    ))
);

jest.mock('../../components/common/ErrorWithPlaceholder/ErrorPlaceHolder', () =>
  jest.fn().mockImplementation(({ type, children }) => (
    <div>
      ErrorPlaceHolder
      <span>{type}</span>
      <div>{children}</div>
    </div>
  ))
);

jest.mock(
  '../../components/ContainerDetail/ContainerChildren/ContainerChildren',
  () => jest.fn().mockReturnValue(<>ContainerChildren</>)
);

jest.mock(
  '../../components/ContainerDetail/ContainerDataModel/ContainerDataModel',
  () => jest.fn().mockReturnValue(<span>ContainerDataModel</span>)
);

jest.mock(
  '../../components/DataAssets/DataAssetsHeader/DataAssetsHeader.component',
  () => ({
    DataAssetsHeader: jest.fn().mockImplementation(
      ({
        afterDeleteAction,
        //   afterDomainUpdateAction,
        //   handleUpdateDisplayName,
        onFollowClick,
        //   handleUpdateOwner,
        //   handleRestoreContainer,
        //   handleUpdateTier,
        //   updateVote,
        //   versionHandler,
      }) => (
        <div data-testid="data-asset-header">
          <button onClick={() => afterDeleteAction()}>Hard Delete</button>
          <button onClick={onFollowClick}>Follow Container</button>
        </div>
      )
    ),
  })
);

jest.mock('../../components/Entity/EntityRightPanel/EntityRightPanel', () =>
  jest.fn().mockReturnValue(<>EntityRightPanel</>)
);

jest.mock('../../components/Lineage/Lineage.component', () =>
  jest.fn().mockReturnValue(<>EntityLineage</>)
);

jest.mock('../../components/LineageProvider/LineageProvider', () =>
  jest.fn().mockReturnValue(<>LineageProvider</>)
);

jest.mock('../../components/Loader/Loader', () =>
  jest.fn().mockReturnValue(<div>Loader</div>)
);

jest.mock('../../components/PageLayoutV1/PageLayoutV1', () =>
  jest.fn().mockImplementation(({ children }) => <>{children}</>)
);

jest.mock('../../components/PermissionProvider/PermissionProvider', () => ({
  usePermissionProvider: jest.fn().mockImplementation(() => ({
    getEntityPermissionByFqn: mockGetEntityPermissionByFqn,
  })),
}));

jest.mock('../../rest/feedsAPI', () => ({
  postThread: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('../../rest/storageAPI', () => ({
  addContainerFollower: jest.fn(),
  getContainerByName: jest
    .fn()
    .mockImplementation(() => mockGetContainerByName()),
  patchContainerDetails: jest.fn().mockImplementation(() => Promise.resolve()),
  removeContainerFollower: jest
    .fn()
    .mockImplementation(() => Promise.resolve()),
  restoreContainer: jest.fn().mockImplementation(() => Promise.resolve()),
}));

// jest.mock('../../utils/CommonUtils', () => ({
//   addToRecentViewed: jest.fn(),
//   getEntityMissingError: jest.fn(),
//   getFeedCounts: jest.fn(),
//   sortTagsCaseInsensitive: jest.fn(),
// }));

jest.mock('../../utils/StringsUtils', () => ({
  getDecodedFqn: jest.fn().mockImplementation((fqn) => fqn),
}));

const mockParams = {
  fqn: 's3_storage_sample.transactions',
  tab: 'schema',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn().mockImplementation(() => mockParams),
}));

describe('Container Page Component', () => {
  it('should show error-placeholder, if not have view permission', async () => {
    mockGetEntityPermissionByFqn.mockResolvedValueOnce({
      ViewBasic: false,
    });

    await act(() => {
      render(<ContainerPage />);

      expect(screen.getByText('Loader')).toBeVisible();
    });

    expect(mockGetEntityPermissionByFqn).toHaveBeenCalled();

    expect(mockGetContainerByName).not.toHaveBeenCalled();

    await waitForElementToBeRemoved(() => screen.getByText('Loader'));

    expect(
      screen.getByText(ERROR_PLACEHOLDER_TYPE.PERMISSION)
    ).toBeInTheDocument();
  });

  it('fetch container data, if have view permission', async () => {
    await act(async () => {
      render(<ContainerPage />);

      expect(screen.getByText('Loader')).toBeVisible();
    });

    expect(mockGetEntityPermissionByFqn).toHaveBeenCalled();
    expect(mockGetContainerByName).toHaveBeenCalled();
  });

  it('show ErrorPlaceHolder if container data fetch fail', async () => {
    mockGetContainerByName.mockRejectedValueOnce(
      'failed to fetch container data'
    );

    await act(async () => {
      render(<ContainerPage />);

      expect(screen.getByText('Loader')).toBeVisible();
    });

    expect(mockGetEntityPermissionByFqn).toHaveBeenCalled();
    expect(mockGetContainerByName).toHaveBeenCalled();

    expect(screen.getByText('ErrorPlaceHolder')).toBeInTheDocument();
  });

  it('should render the page container data, with the schema tab selected', async () => {
    await act(async () => {
      render(<ContainerPage />);

      expect(screen.getByText('Loader')).toBeVisible();
    });

    expect(mockGetEntityPermissionByFqn).toHaveBeenCalled();
    expect(mockGetContainerByName).toHaveBeenCalled();

    expect(screen.getByTestId('data-asset-header')).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');

    expect(tabs).toHaveLength(5);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('DescriptionV1')).toBeVisible();
    expect(screen.getByText('ContainerDataModel')).toBeVisible();
    expect(screen.getByText('EntityRightPanel')).toBeVisible();
  });

  it('activity thread panel should render after selecting thread link', async () => {
    await act(async () => {
      render(<ContainerPage />);

      expect(screen.getByText('Loader')).toBeVisible();
    });

    const DescriptionV1 = screen.getByText('DescriptionV1');

    expect(DescriptionV1).toBeVisible();

    expect(screen.queryByText('ActivityThreadPanel')).not.toBeInTheDocument();

    userEvent.click(DescriptionV1);

    expect(screen.getByText('ActivityThreadPanel')).toBeInTheDocument();
  });

  it('onClick of follow container should call addContainerFollower', async () => {
    await act(async () => {
      render(<ContainerPage />);

      expect(screen.getByText('Loader')).toBeVisible();
    });

    const followButton = screen.getByRole('button', {
      name: 'Follow Container',
    });

    userEvent.click(followButton);

    expect(addContainerFollower).toHaveBeenCalled();
  });
});
