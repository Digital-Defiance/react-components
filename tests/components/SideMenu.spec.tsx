import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material';
import { SideMenu } from '../../src/components/SideMenu';
import { MenuProvider, AuthContext, I18nProvider, AppThemeProvider, SuiteConfigProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

// Mock the auth and API services
jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
  })),
}));

jest.mock('../../src/services/authService', () => ({
  createAuthService: jest.fn(() => ({
    verifyToken: jest.fn().mockResolvedValue({ valid: false, userData: null }),
    refreshToken: jest.fn().mockResolvedValue({ token: null }),
  })),
}));

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

describe('SideMenu', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders drawer when open', () => {
    const { container } = render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(container.querySelector('.MuiDrawer-root')).toBeDefined();
  });

  it('renders menu items when authenticated', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeDefined();
  });

  it('does not show authenticated items when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByText(/dashboard/i)).toBeNull();
  });

  it('renders theme toggle menu item', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Verify the theme toggle menu item is present
    // When in light mode, it should say "Set Dark Mode"
    const themeToggleItem = screen.getByText(/dark mode/i);
    expect(themeToggleItem).toBeDefined();
  });

  it('calls onClose when theme toggle is clicked', async () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const themeToggleItem = screen.getByText(/dark mode/i);
    fireEvent.click(themeToggleItem);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
