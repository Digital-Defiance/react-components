import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DropdownMenu } from '../../src/components/DropdownMenu';
import { MenuProvider, AuthContext, I18nProvider, AppThemeProvider, SuiteConfigProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { MenuTypes } from '../../src/types/MenuType';
import NotificationsIcon from '@mui/icons-material/Notifications';

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

describe('DropdownMenu', () => {
  it('renders menu icon', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <DropdownMenu menuType={MenuTypes.UserMenu} menuIcon={<NotificationsIcon data-testid="menu-icon" />} />
      </TestWrapper>
    );

    expect(screen.getByTestId('menu-icon')).toBeDefined();
  });

  it('opens menu on icon click', async () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <DropdownMenu menuType={MenuTypes.UserMenu} menuIcon={<NotificationsIcon data-testid="menu-icon" />} />
      </TestWrapper>
    );

    const iconButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(iconButton!);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeDefined();
    });
  });

  it('renders with unauthenticated menu items', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <DropdownMenu menuType={MenuTypes.UserMenu} menuIcon={<NotificationsIcon data-testid="notif-icon" />} />
      </TestWrapper>
    );

    // UserMenu type has items for unauthenticated users (login, register, etc.)
    expect(screen.getByTestId('notif-icon')).toBeDefined();
  });
});
