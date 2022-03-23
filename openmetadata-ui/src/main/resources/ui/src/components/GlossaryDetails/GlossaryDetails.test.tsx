import { findByText, getByTestId, render } from '@testing-library/react';
import React from 'react';
import { mockedGlossaries } from '../../mocks/Glossary.mock';
import GlossaryDetails from './GlossaryDetails.component';

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn(),
  useParams: jest.fn().mockReturnValue({
    glossaryName: 'GlossaryName',
  }),
}));

jest.mock('../../auth-provider/AuthProvider', () => {
  return {
    useAuthContext: jest.fn(() => ({
      isAuthDisabled: false,
      isAuthenticated: true,
      isProtectedRoute: jest.fn().mockReturnValue(true),
      isTourRoute: jest.fn().mockReturnValue(false),
      onLogoutHandler: jest.fn(),
    })),
  };
});

jest.mock('../../components/tags-container/tags-container', () => {
  return jest.fn().mockReturnValue(<>Tags-container component</>);
});

jest.mock('../../components/common/description/Description', () => {
  return jest.fn().mockReturnValue(<>Description component</>);
});

jest.mock('../../components/common/non-admin-action/NonAdminAction', () => {
  return jest
    .fn()
    .mockImplementation(({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ));
});

const mockProps = {
  glossary: mockedGlossaries[0],
  isHasAccess: true,
  updateGlossary: jest.fn(),
};

describe('Test Glossary-details component', () => {
  it('Should render Glossary-details component', async () => {
    const { container } = render(<GlossaryDetails {...mockProps} />);

    const glossaryDetails = await getByTestId(container, 'glossary-details');

    expect(glossaryDetails).toBeInTheDocument();
  });

  it('Should render Tags-container', async () => {
    const { container } = render(<GlossaryDetails {...mockProps} />);

    const tagsContainer = await findByText(
      container,
      /Tags-container component/i
    );

    expect(tagsContainer).toBeInTheDocument();
  });

  it('Should render Description', async () => {
    const { container } = render(<GlossaryDetails {...mockProps} />);

    const description = await findByText(container, /Description component/i);

    expect(description).toBeInTheDocument();
  });
});
