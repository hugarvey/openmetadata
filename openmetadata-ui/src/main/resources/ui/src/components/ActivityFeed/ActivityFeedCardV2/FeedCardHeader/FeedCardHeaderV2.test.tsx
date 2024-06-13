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
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CardStyle } from '../../../../generated/entity/feed/thread';
import FeedCardHeaderV2 from './FeedCardHeaderV2';

jest.mock('../../../../utils/TableUtils', () => ({
  getEntityIcon: jest.fn().mockReturnValue('entityIcon'),
}));

jest.mock('../../../../utils/date-time/DateTimeUtils', () => ({
  formatDateTime: jest.fn().mockImplementation((date) => date),
  getRelativeTime: jest.fn().mockImplementation((date) => date),
}));

jest.mock('../../../../utils/FeedUtils', () => ({
  entityDisplayName: jest.fn().mockReturnValue('entityDisplayName'),
  getEntityFQN: jest.fn().mockImplementation((data) => data),
  getEntityType: jest.fn().mockImplementation((data) => data),
  getFeedHeaderTextFromCardStyle: jest
    .fn()
    .mockReturnValue('getFeedHeaderTextFromCardStyle'),
}));

jest.mock('../../../../utils/EntityUtils', () => ({
  getEntityName: jest.fn(),
}));

jest.mock('../../../../hooks/user-profile/useUserProfile', () => ({
  useUserProfile: jest.fn().mockReturnValue([]),
}));

jest.mock('../../../../constants/constants', () => ({
  getUserPath: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: jest
    .fn()
    .mockImplementation(({ children, ...props }) => (
      <span {...props}>{children}</span>
    )),
}));

jest.mock('../../../../utils/EntityUtilClassBase', () => ({
  getEntityLink: jest.fn(),
}));

jest.mock('../../../common/PopOverCard/EntityPopOverCard', () => {
  return jest.fn().mockReturnValue(<p>EntityPopOverCard</p>);
});

jest.mock('../../../common/PopOverCard/UserPopOverCard', () => {
  return jest.fn().mockImplementation(() => <>UserPopOverCard</>);
});

const mockProps = {
  about: '<#E::table::sample_data.e_commerce_db.shopify.dim_customer>',
  createdBy: 'admin',
  isEntityFeed: false,
  isAnnouncement: false,
};

describe('Test FeedCardHeaderV2 Component', () => {
  it('render basic information', () => {
    render(<FeedCardHeaderV2 {...mockProps} />);

    expect(screen.getByText('UserPopOverCard')).toBeInTheDocument();
    expect(screen.queryByTestId('timestamp')).not.toBeInTheDocument();
  });

  it('should render timestamp information', () => {
    render(<FeedCardHeaderV2 {...mockProps} timeStamp={1717328605008} />);

    expect(screen.getByTestId('timestamp')).toBeInTheDocument();
  });

  it('should render header body information with redirect links if cardStyle is not created or deleted', () => {
    render(<FeedCardHeaderV2 {...mockProps} />);

    expect(screen.getByTestId('headerText')).toBeInTheDocument();
    expect(
      screen.getByText('getFeedHeaderTextFromCardStyle')
    ).toBeInTheDocument();

    expect(screen.getByText('EntityPopOverCard')).toBeInTheDocument();
  });

  it('should render header body information without redirect links if cardStyle is created', () => {
    render(
      <FeedCardHeaderV2 {...mockProps} cardStyle={CardStyle.EntityCreated} />
    );

    expect(screen.getByTestId('headerText')).toBeInTheDocument();
    expect(
      screen.getByText('getFeedHeaderTextFromCardStyle')
    ).toBeInTheDocument();

    expect(screen.getByText('entityIcon')).toBeInTheDocument();

    expect(screen.queryByTestId('EntityPopOverCard')).not.toBeInTheDocument();
  });

  it('should render header body information without redirect links if cardStyle is deleted', () => {
    render(
      <FeedCardHeaderV2 {...mockProps} cardStyle={CardStyle.EntityDeleted} />
    );

    expect(screen.getByTestId('headerText')).toBeInTheDocument();
    expect(
      screen.getByText('getFeedHeaderTextFromCardStyle')
    ).toBeInTheDocument();

    expect(screen.getByText('entityIcon')).toBeInTheDocument();

    expect(screen.queryByTestId('EntityPopOverCard')).not.toBeInTheDocument();
  });

  it('should render header body information with UserPopOverCard if entityType User', () => {
    render(<FeedCardHeaderV2 {...mockProps} about="<#E::user::admin>" />);

    expect(screen.getByTestId('headerText')).toBeInTheDocument();
    expect(
      screen.getByText('getFeedHeaderTextFromCardStyle')
    ).toBeInTheDocument();

    expect(screen.getByText('UserPopOverCard')).toBeInTheDocument();
  });

  it('should render header body information with UserPopOverCard if entityType Team', () => {
    render(<FeedCardHeaderV2 {...mockProps} about="<#E::team::accounting>" />);

    expect(screen.getByTestId('headerText')).toBeInTheDocument();
    expect(
      screen.getByText('getFeedHeaderTextFromCardStyle')
    ).toBeInTheDocument();

    expect(screen.getByText('UserPopOverCard')).toBeInTheDocument();
  });

  it('should not render getFeedHeaderTextFromCardStyle is isAnnouncement is true', () => {
    render(<FeedCardHeaderV2 {...mockProps} isAnnouncement />);

    expect(screen.getByText('label.posted-on-lowercase')).toBeInTheDocument();
    expect(
      screen.queryByText('getFeedHeaderTextFromCardStyle')
    ).not.toBeInTheDocument();
  });
});
