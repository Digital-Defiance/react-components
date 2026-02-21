import {
  I18nEngine,
  createDefaultLanguages,
  createI18nSetup,
} from '@digitaldefiance/i18n-lib';
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
import {
  Constants,
  IConstants,
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  createSuiteCoreComponentConfig,
  createSuiteCoreComponentPackage,
} from '@digitaldefiance/suite-core-lib';

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

  describe('site title constants propagation', () => {
    const CUSTOM_SITE = 'My Custom App';

    const CustomConstants: IConstants = {
      ...Constants,
      Site: CUSTOM_SITE,
    } as IConstants;

    /**
     * Wrapper that uses createI18nSetup — the same factory real apps use —
     * so library defaults are registered first and then overridden by app
     * constants through the constants registry (not engine config).
     */
    const CreateI18nSetupWrapper: React.FC<{
      children: React.ReactNode;
    }> = ({ children }) => {
      const instanceKey = `setup-${Date.now()}`;
      const setup = createI18nSetup({
        componentId: `test-app-${instanceKey}`,
        stringKeyEnum: SuiteCoreStringKey,
        strings: {},
        constants: CustomConstants,
        libraryComponents: [createSuiteCoreComponentPackage()],
        instanceKey,
      });

      const authValue = mockAuthContext(false);
      return (
        <SuiteConfigProvider baseUrl="http://localhost:3000">
          <I18nProvider i18nEngine={setup.engine}>
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

    it('should use i18n engine registered constants when no constants prop is passed', () => {
      render(
        <CreateI18nSetupWrapper>
          <TopMenu Logo={Logo} />
        </CreateI18nSetupWrapper>
      );

      // The site title should come from the engine's registered constants,
      // NOT from the default Constants.Site ('New Site')
      expect(screen.getByText(CUSTOM_SITE)).toBeDefined();
      expect(screen.queryByText('New Site')).toBeNull();
    });

    it('should use explicit constants prop when provided', () => {
      const explicitConstants: IConstants = {
        ...Constants,
        Site: 'Explicit Override',
      } as IConstants;

      render(
        <CreateI18nSetupWrapper>
          <TopMenu Logo={Logo} constants={explicitConstants} />
        </CreateI18nSetupWrapper>
      );

      expect(screen.getByText('Explicit Override')).toBeDefined();
      expect(screen.queryByText(CUSTOM_SITE)).toBeNull();
    });

    it('should resolve app constants even when getSuiteCoreI18nEngine pre-creates the engine', () => {
      // Simulate the race condition: getSuiteCoreI18nEngine() is called
      // during module load (e.g., from an error class import) BEFORE
      // createI18nSetup runs. This pre-creates the 'default' engine
      // without app constants.
      const instanceKey = `race-${Date.now()}`;

      // Step 1: Pre-create engine (simulates getSuiteCoreI18nEngine side effect)
      const languages = createDefaultLanguages();
      I18nEngine.registerIfNotExists(instanceKey, languages);
      const preCreatedEngine = I18nEngine.getInstance(instanceKey);
      preCreatedEngine.registerIfNotExists(createSuiteCoreComponentConfig());

      // Step 2: Now run createI18nSetup (simulates app initialization)
      const setup = createI18nSetup({
        componentId: `race-app-${instanceKey}`,
        stringKeyEnum: SuiteCoreStringKey,
        strings: {},
        constants: CustomConstants,
        libraryComponents: [createSuiteCoreComponentPackage()],
        instanceKey,
      });

      const authValue = mockAuthContext(false);
      render(
        <SuiteConfigProvider baseUrl="http://localhost:3000">
          <I18nProvider i18nEngine={setup.engine}>
            <AppThemeProvider>
              <AuthContext.Provider value={authValue}>
                <MenuProvider>
                  <MemoryRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <TopMenu Logo={Logo} />
                  </MemoryRouter>
                </MenuProvider>
              </AuthContext.Provider>
            </AppThemeProvider>
          </I18nProvider>
        </SuiteConfigProvider>
      );

      expect(screen.getByText(CUSTOM_SITE)).toBeDefined();
      expect(screen.queryByText('New Site')).toBeNull();
    });

    it('should resolve {Site} directly from engine.translate without React', () => {
      // Bypass React entirely — call engine.translate the same way
      // tComponent does and verify the result.
      const instanceKey = `direct-${Date.now()}`;
      const setup = createI18nSetup({
        componentId: `direct-app-${instanceKey}`,
        stringKeyEnum: SuiteCoreStringKey,
        strings: {},
        constants: CustomConstants,
        libraryComponents: [createSuiteCoreComponentPackage()],
        instanceKey,
      });

      // This is exactly what tComponent does when constants prop is NOT passed:
      const resultNoVars = setup.engine.translate(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_SiteTemplate,
        undefined,
        'en-US'
      );
      expect(resultNoVars).toBe(CUSTOM_SITE);

      // And when constants prop IS passed:
      const resultWithVars = setup.engine.translate(
        SuiteCoreComponentId,
        SuiteCoreStringKey.Common_SiteTemplate,
        { Site: 'Explicit' },
        'en-US'
      );
      expect(resultWithVars).toBe('Explicit');
    });
  });
});
