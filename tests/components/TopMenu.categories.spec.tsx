import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TopMenu } from '../../src/components/TopMenu';
import { ICategoryConfig } from '../../src/interfaces/ICategoryConfig';
import {
  MenuProvider,
  AuthContext,
  I18nProvider,
  AppThemeProvider,
  SuiteConfigProvider,
} from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { MenuTypes } from '../../src/types/MenuType';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const TestWrapper: React.FC<{
  isAuthenticated: boolean;
  children: React.ReactNode;
}> = ({ isAuthenticated, children }) => {
  const engine = I18nEngine.getInstance('default');
  const authValue = {
    isAuthenticated,
    isCheckingAuth: false,
    userData: null,
    mnemonic: null,
    wallet: null,
    language: 'en-US',
    setLanguage: jest.fn(),
    clearMnemonic: jest.fn(),
    clearWallet: jest.fn(),
  } as any;
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

describe('TopMenu with categories', () => {
  const Logo = <div>Test Logo</div>;
  const categories: ICategoryConfig[] = [
    {
      id: 'apps',
      icon: <NotificationsIcon data-testid="apps-category-icon" />,
      label: 'Apps',
      columns: 2,
      showLabels: true,
    },
  ];
  const additionalMenus = [
    {
      menuType: MenuTypes.TopMenu,
      menuIcon: <CalendarTodayIcon data-testid="calendar-icon" />,
      label: 'Calendar',
      category: 'apps',
      priority: 1,
      hideWhenEmpty: false,
    },
    {
      menuType: MenuTypes.TopMenu,
      menuIcon: <NotificationsIcon data-testid="notif-icon" />,
      label: 'Notifications',
      category: 'apps',
      priority: 2,
      hideWhenEmpty: false,
    },
  ];

  it('renders category icon in AppBar', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu
          Logo={Logo}
          categories={categories}
          additionalMenus={additionalMenus}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId('apps-category-icon')).toBeDefined();
  });

  it('shows menu tiles in popover when category icon clicked', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu
          Logo={Logo}
          categories={categories}
          additionalMenus={additionalMenus}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByTestId('apps-category-icon').parentElement!);
    expect(screen.getByTestId('calendar-icon')).toBeDefined();
    expect(screen.getByTestId('notif-icon')).toBeDefined();
    expect(screen.getByText('Calendar')).toBeDefined();
    expect(screen.getByText('Notifications')).toBeDefined();
  });

  it('falls back to inline if no categories', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <TopMenu Logo={Logo} additionalMenus={additionalMenus} />
      </TestWrapper>
    );
    // Should render both menu icons directly in the AppBar
    expect(screen.getByTestId('calendar-icon')).toBeDefined();
    expect(screen.getByTestId('notif-icon')).toBeDefined();
  });
});
