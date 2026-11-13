import { LanguageRegistry } from '@digitaldefiance/i18n-lib';
import { createContext, ReactNode, useContext } from 'react';

export interface SuiteConfigRoutes {
  dashboard?: string;
  login?: string;
  register?: string;
  verifyEmail?: string;
  forgotPassword?: string;
  resetPassword?: string;
  settings?: string;
}

export interface SuiteConfigContextData {
  /**
   * Base URL for API calls
   */
  baseUrl: string;
  
  /**
   * Application routes for navigation
   */
  routes: SuiteConfigRoutes;
  
  /**
   * Available languages for the application
   */
  languages: Array<{ code: string; label: string }>;
  
  /**
   * Available timezones
   */
  timezones?: string[];
}

const defaultRoutes: SuiteConfigRoutes = {
  dashboard: '/dashboard',
  login: '/login',
  register: '/register',
  verifyEmail: '/verify-email',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  settings: '/settings',
};

/**
 * Used only when no language registry has been configured. Codes match the
 * bundled i18n-lib registry (e.g. `fr`, not `fr-FR`) so selecting one is
 * always accepted by I18nProvider.
 */
const bundledLanguages = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'uk', label: 'Українська' },
];

/**
 * The app's supported languages: whatever is registered in the LanguageRegistry,
 * so the settings selector offers exactly what I18nProvider can switch to.
 */
const getDefaultLanguages = (): Array<{ code: string; label: string }> => {
  const registered = LanguageRegistry.getCodeLabelMap();
  return registered.length > 0 ? registered : bundledLanguages;
};

const SuiteConfigContext = createContext<SuiteConfigContextData | undefined>(undefined);

export interface SuiteConfigProviderProps {
  children: ReactNode;
  baseUrl: string;
  routes?: Partial<SuiteConfigRoutes>;
  languages?: Array<{ code: string; label: string }>;
  timezones?: string[];
}

export const SuiteConfigProvider = ({
  children,
  baseUrl,
  routes = {},
  languages,
  timezones,
}: SuiteConfigProviderProps) => {
  const value: SuiteConfigContextData = {
    baseUrl,
    routes: { ...defaultRoutes, ...routes },
    languages: languages ?? getDefaultLanguages(),
    timezones,
  };

  return (
    <SuiteConfigContext.Provider value={value}>
      {children}
    </SuiteConfigContext.Provider>
  );
};

export const useSuiteConfig = (): SuiteConfigContextData => {
  const context = useContext(SuiteConfigContext);
  if (!context) {
    throw new Error('useSuiteConfig must be used within a SuiteConfigProvider');
  }
  return context;
};
