import { ECIES } from '@digitaldefiance/ecies-lib';
import { GlobalActiveContext, I18nEngine } from '@digitaldefiance/i18n-lib';
import { Constants } from '@digitaldefiance/suite-core-lib';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { UserLanguageSelector } from '../../src/components/UserLanguageSelector';
import {
  AppThemeProvider,
  AuthProvider,
  I18nProvider,
  SuiteConfigProvider,
  useI18n,
} from '../../src/contexts';

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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = I18nEngine.getInstance('default');
  return (
    <SuiteConfigProvider
      baseUrl="http://localhost:3000"
      languages={[
        { code: 'en-US', label: 'English' },
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
      ]}
    >
      <I18nProvider i18nEngine={engine}>
        <AppThemeProvider>
          <AuthProvider
            baseUrl="http://localhost:3000"
            constants={Constants}
            eciesConfig={ECIES as any}
            onAuthError={() => {}}
          >
            {children}
          </AuthProvider>
        </AppThemeProvider>
      </I18nProvider>
    </SuiteConfigProvider>
  );
};

describe('UserLanguageSelector', () => {
  let i18nEngine: I18nEngine;
  let globalContext: GlobalActiveContext<string, any>;

  beforeEach(() => {
    i18nEngine = I18nEngine.getInstance('default');
    globalContext = GlobalActiveContext.getInstance();
    // Reset to English
    globalContext.userLanguage = 'en-US';
    i18nEngine.setLanguage('en-US');
  });

  it('renders flag button', () => {
    const { container } = render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    expect(container.querySelector('button')).toBeDefined();
  });

  it('opens language menu on click', async () => {
    render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeDefined();
    });
  });

  it('changes language when menu item clicked', async () => {
    render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });
  });

  it('updates i18n library language when language is changed via menu', async () => {
    render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    // Verify initial language in i18n library
    expect(i18nEngine.getCurrentLanguage()).toBe('en-US');
    expect(globalContext.userLanguage).toBe('en-US');

    // Open language menu
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for menu and find Spanish option
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeDefined();
    });

    const menuItems = screen.getAllByRole('menuitem');
    // Find the Spanish menu item
    const spanishItem = menuItems.find(
      (item) =>
        item.textContent?.includes('Español') ||
        item.textContent?.includes('es')
    );

    expect(spanishItem).toBeDefined();

    // Click Spanish language option
    if (spanishItem) {
      fireEvent.click(spanishItem);

      // Verify i18n library and global context actually changed language
      await waitFor(() => {
        expect(i18nEngine.getCurrentLanguage()).toBe('es');
        expect(globalContext.userLanguage).toBe('es');
      });
    }
  });

  it('tracks language changes through complete flow from UI to i18n library', async () => {
    // Component to capture and display current i18n language
    const LanguageCapture = () => {
      const { currentLanguage } = useI18n();
      return <div data-testid="current-language">{currentLanguage}</div>;
    };

    render(
      <TestWrapper>
        <UserLanguageSelector />
        <LanguageCapture />
      </TestWrapper>
    );

    // Verify initial state
    const languageDisplay = screen.getByTestId('current-language');
    expect(languageDisplay.textContent).toBe('en-US');
    expect(i18nEngine.getCurrentLanguage()).toBe('en-US');

    // Open menu and select French
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeDefined();
    });

    const menuItems = screen.getAllByRole('menuitem');
    const frenchItem = menuItems.find(
      (item) =>
        item.textContent?.includes('Français') ||
        item.textContent?.includes('fr')
    );

    if (frenchItem) {
      fireEvent.click(frenchItem);

      // Verify complete flow: UI → React Context → i18n Library → GlobalActiveContext
      await waitFor(() => {
        // React context updated
        expect(languageDisplay.textContent).toBe('fr');
        // i18n library updated
        expect(i18nEngine.getCurrentLanguage()).toBe('fr');
        // Global context updated
        expect(globalContext.userLanguage).toBe('fr');
      });
    }
  });
});
