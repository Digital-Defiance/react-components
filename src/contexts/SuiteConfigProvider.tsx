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

const defaultLanguages = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'es-ES', label: 'Español' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '中文 (简体)' },
  { code: 'uk', label: 'Українська' },
];

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
  languages = defaultLanguages,
  timezones,
}: SuiteConfigProviderProps) => {
  const value: SuiteConfigContextData = {
    baseUrl,
    routes: { ...defaultRoutes, ...routes },
    languages,
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
