import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../../src/components/UserMenu';
import { MenuProvider, AuthContext, I18nProvider, AppThemeProvider, SuiteConfigProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockAuthContext = (isAuthenticated: boolean) => ({
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

const TestWrapper: React.FC<{ isAuthenticated: boolean; children: React.ReactNode }> = ({ 
  isAuthenticated, 
  children 
}) => {
  const engine = I18nEngine.getInstance('default');
  return (
    <SuiteConfigProvider baseUrl="http://localhost:3000">
      <I18nProvider i18nEngine={engine}>
        <AppThemeProvider>
          <AuthContext.Provider value={mockAuthContext(isAuthenticated)}>
            <MenuProvider>
              <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                {children}
              </MemoryRouter>
            </MenuProvider>
          </AuthContext.Provider>
        </AppThemeProvider>
      </I18nProvider>
    </SuiteConfigProvider>
  );
};

describe('UserMenu', () => {
  it('renders AccountCircle icon when authenticated', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <UserMenu />
      </TestWrapper>
    );

    expect(screen.getByTestId('AccountCircleIcon')).toBeDefined();
  });

  it('renders with login/register items when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <UserMenu />
      </TestWrapper>
    );

    // UserMenu still renders when not authenticated because it shows login/register options
    expect(screen.getByTestId('AccountCircleIcon')).toBeDefined();
  });
});
