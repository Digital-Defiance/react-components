import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MenuProvider, AuthContext, I18nProvider, AppThemeProvider, SuiteConfigProvider, useMenu } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { MenuTypes } from '../../src/types/MenuType';

// Mock the auth and API services
const mockPost = jest.fn().mockResolvedValue({ data: {} });
jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    post: mockPost,
    get: jest.fn().mockResolvedValue({ data: {} }),
  })),
}));

jest.mock('../../src/services/authService', () => ({
  createAuthService: jest.fn(() => ({
    verifyToken: jest.fn().mockResolvedValue({ valid: false, userData: null }),
    refreshToken: jest.fn().mockResolvedValue({ token: null }),
  })),
}));

const mockAuthContext = (isAuthenticated: boolean, userSettings?: any) => ({
  isAuthenticated,
  isCheckingAuth: false,
  userData: isAuthenticated ? {
    email: 'test@example.com',
    darkMode: userSettings?.darkMode ?? false,
    timezone: 'UTC',
    siteLanguage: 'en-US',
    currency: 'USD',
    directChallenge: false,
  } : null,
  userSettings: isAuthenticated ? {
    email: 'test@example.com',
    darkMode: userSettings?.darkMode ?? false,
    timezone: 'UTC',
    siteLanguage: 'en-US',
    currency: 'USD',
    directChallenge: false,
  } : undefined,
  mnemonic: userSettings?.mnemonic ?? null,
  wallet: userSettings?.wallet ?? null,
  clearMnemonic: jest.fn(),
  clearWallet: jest.fn(),
  setUserSetting: jest.fn().mockResolvedValue(undefined),
} as any);

interface TestWrapperProps {
  isAuthenticated: boolean;
  userSettings?: any;
  children: React.ReactNode;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ 
  isAuthenticated,
  userSettings,
  children 
}) => {
  const engine = I18nEngine.getInstance('default');
  return (
    <SuiteConfigProvider baseUrl="http://localhost:3000">
      <I18nProvider i18nEngine={engine}>
        <AppThemeProvider>
          <AuthContext.Provider value={mockAuthContext(isAuthenticated, userSettings)}>
            <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              {children}
            </MemoryRouter>
          </AuthContext.Provider>
        </AppThemeProvider>
      </I18nProvider>
    </SuiteConfigProvider>
  );
};

const TestMenuComponent = () => {
  const { menuOptions, getMenuOptions } = useMenu();
  const sideMenuOptions = getMenuOptions(MenuTypes.SideMenu, true);
  
  return (
    <div>
      <div data-testid="menu-count">{menuOptions.length}</div>
      <div data-testid="side-menu-count">{sideMenuOptions.length}</div>
      {sideMenuOptions.map((option) => (
        <div key={option.id} data-testid={`menu-${option.id}`}>
          {option.label}
          {option.action && (
            <button 
              data-testid={`action-${option.id}`}
              onClick={option.action}
            >
              {option.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

describe('MenuContext', () => {
  beforeEach(() => {
    mockPost.mockClear();
  });

  it('should provide menu options when authenticated', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-count').textContent).not.toBe('0');
    expect(screen.getByTestId('menu-dashboard')).toBeDefined();
  });

  it('should show theme toggle option in light mode', () => {
    render(
      <TestWrapper isAuthenticated={true} userSettings={{ darkMode: false }}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    const themeToggle = screen.getByTestId('menu-theme-toggle');
    // MenuContext creates the label, which should reference dark mode when in light mode
    expect(themeToggle).toBeDefined();
    expect(themeToggle.textContent).toContain('Dark Mode');
  });

  it('should show theme toggle option when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    // Theme toggle should still be available when not authenticated
    const themeToggle = screen.getByTestId('menu-theme-toggle');
    expect(themeToggle).toBeDefined();
  });

  it('should have toggle action for theme toggle menu item', () => {
    render(
      <TestWrapper isAuthenticated={true} userSettings={{ darkMode: false }}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    // Verify the action button exists (meaning action is defined)
    const themeToggleButton = screen.getByTestId('action-theme-toggle');
    expect(themeToggleButton).toBeDefined();
  });

  it('should show clear mnemonic option when mnemonic exists', () => {
    render(
      <TestWrapper isAuthenticated={true} userSettings={{ mnemonic: 'test-mnemonic' }}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-clear-mnemonic')).toBeDefined();
  });

  it('should show clear wallet option when wallet exists', () => {
    render(
      <TestWrapper isAuthenticated={true} userSettings={{ wallet: { address: '0x123' } }}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-clear-wallet')).toBeDefined();
  });

  it('should not show authenticated options when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    expect(screen.queryByTestId('menu-dashboard')).toBeNull();
    expect(screen.queryByTestId('menu-logout')).toBeNull();
  });

  it('should show login and register when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-login')).toBeDefined();
    expect(screen.getByTestId('menu-register')).toBeDefined();
  });

  it('should filter menu options by menu type', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <MenuProvider>
          <TestMenuComponent />
        </MenuProvider>
      </TestWrapper>
    );

    const sideMenuCount = parseInt(screen.getByTestId('side-menu-count').textContent || '0');
    expect(sideMenuCount).toBeGreaterThan(0);
  });
});
