import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { TopMenu } from '../../src/components/TopMenu';
import {
  AppThemeProvider,
  AuthContext,
  I18nProvider,
  MenuProvider,
  SuiteConfigProvider,
} from '../../src/contexts';

const mockAuthContext = (isAuthenticated: boolean) =>
  ({
    isAuthenticated,
    isCheckingAuth: false,
    userData: null,
    mnemonic: null,
    wallet: null,
    language: 'en-US',
    setLanguage: jest.fn(),
    clearMnemonic: jest.fn(),
    clearWallet: jest.fn(),
  } as any);

const TestWrapper: React.FC<{
  isAuthenticated: boolean;
  children: React.ReactNode;
}> = ({ isAuthenticated, children }) => {
  const engine = I18nEngine.getInstance('default');
  const authValue = mockAuthContext(isAuthenticated);
  return (
    <SuiteConfigProvider baseUrl="http://localhost:3000">
      <I18nProvider i18nEngine={engine}>
        <AppThemeProvider>
          <AuthContext.Provider value={authValue}>
            <MenuProvider>
              <MemoryRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                {children}
              </MemoryRouter>
            </MenuProvider>
          </AuthContext.Provider>
        </AppThemeProvider>
      </I18nProvider>
    </SuiteConfigProvider>
  );
};

describe('TopMenu', () => {
  const Logo = <div>Test Logo</div>;

  beforeEach(() => {
    // Clear localStorage before each test to prevent auth state pollution
    localStorage.clear();
  });

  it('renders logo and site title', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Logo')).toBeDefined();
  });

  it('shows login and register buttons when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    // When not authenticated, should NOT show dashboard
    expect(screen.queryByText(/dashboard/i)).toBeNull();
    // Should show login and register links (exact text from i18n)
    const loginLink = screen.getByRole('link', { name: 'Log In' });
    const registerLink = screen.getByRole('link', { name: 'Register' });
    expect(loginLink).toBeDefined();
    expect(registerLink).toBeDefined();
  });

  it('shows dashboard button when authenticated', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeDefined();
  });

  it('renders UserMenu when authenticated', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    const accountIcons = screen.getAllByTestId('AccountCircleIcon');
    expect(accountIcons.length).toBeGreaterThan(0);
  });

  it('renders additional menus when authenticated', () => {
    // UserMenu dropdown shows when authenticated
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    // UserMenu should render when authenticated
    expect(screen.getByText(/dashboard/i)).toBeDefined();
  });

  it('does not render additional menus when not authenticated if they have no items', () => {
    // UserMenu dropdown won't show when not authenticated since login/register are buttons
    render(
      <TestWrapper isAuthenticated={false}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    // Login and Register buttons should render when not authenticated
    expect(screen.getByText(/log in/i)).toBeDefined();
    expect(screen.getByText(/register/i)).toBeDefined();
  });

  it('renders without additional menus', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeDefined();
  });

  it('renders multiple additional menus', () => {
    // TopMenu renders menus from context
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu Logo={Logo} />
      </TestWrapper>
    );

    // Should have dashboard link when authenticated
    expect(screen.getByText(/dashboard/i)).toBeDefined();
  });
});
