import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CategoryMenu } from '../../src/components/CategoryMenu';
import { ICategoryConfig } from '../../src/interfaces/ICategoryConfig';
import { IMenuConfig } from '../../src/interfaces/IMenuConfig';
import { createMenuType } from '../../src/types/MenuType';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import {
  MenuProvider,
  AuthContext,
  I18nProvider,
  AppThemeProvider,
  SuiteConfigProvider,
} from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

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
  }) as any;

const TestWrapper: React.FC<{
  isAuthenticated: boolean;
  children: React.ReactNode;
}> = ({ isAuthenticated, children }) => {
  const engine = I18nEngine.getInstance('default');
  return (
    <SuiteConfigProvider baseUrl="http://localhost:3000">
      <I18nProvider i18nEngine={engine}>
        <AppThemeProvider>
          <AuthContext.Provider value={mockAuthContext(isAuthenticated)}>
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

const CalendarMenuType = createMenuType('Calendar');
const NotifMenuType = createMenuType('Notifications');

const category: ICategoryConfig = {
  id: 'apps',
  icon: <NotificationsIcon data-testid="category-icon" />,
  label: 'Apps',
  columns: 2,
  showLabels: true,
};

const menus: IMenuConfig[] = [
  {
    menuType: CalendarMenuType,
    menuIcon: <CalendarTodayIcon data-testid="calendar-icon" />,
    label: 'Calendar',
    options: [],
  },
  {
    menuType: NotifMenuType,
    menuIcon: <NotificationsIcon data-testid="notif-icon" />,
    label: 'Notifications',
    options: [],
  },
];

describe('CategoryMenu', () => {
  it('renders category icon', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu category={category} menus={menus} />
      </TestWrapper>
    );
    expect(screen.getByTestId('category-icon')).toBeDefined();
  });

  it('shows popover with menu tiles on click', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu category={category} menus={menus} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByTestId('category-icon').parentElement!);
    expect(screen.getByTestId('calendar-icon')).toBeDefined();
    expect(screen.getByTestId('notif-icon')).toBeDefined();
    expect(screen.getByText('Calendar')).toBeDefined();
    expect(screen.getByText('Notifications')).toBeDefined();
  });

  it('hides when no menus and hideWhenEmpty is true', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu
          category={{ ...category, hideWhenEmpty: true }}
          menus={[]}
        />
      </TestWrapper>
    );
    expect(screen.queryByTestId('category-icon')).toBeNull();
  });

  it('renders category icon when hideWhenEmpty is false and menus are empty', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu
          category={{ ...category, hideWhenEmpty: false }}
          menus={[]}
        />
      </TestWrapper>
    );
    expect(screen.getByTestId('category-icon')).toBeDefined();
  });

  it('shows header label when showHeader is true and popover is open', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu
          category={{ ...category, showHeader: true }}
          menus={menus}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByTestId('category-icon').parentElement!);
    expect(screen.getByText('Apps')).toBeDefined();
  });

  it('does not show header label when showHeader is false', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu
          category={{ ...category, showHeader: false }}
          menus={menus}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByTestId('category-icon').parentElement!);
    expect(screen.queryByText('Apps')).toBeNull();
  });

  it('hides tile labels when showLabels is false', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <CategoryMenu
          category={{ ...category, showLabels: false }}
          menus={menus}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByTestId('category-icon').parentElement!);
    expect(screen.queryByText('Calendar')).toBeNull();
    expect(screen.queryByText('Notifications')).toBeNull();
  });
});
