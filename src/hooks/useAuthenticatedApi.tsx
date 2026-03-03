/**
 * useAuthenticatedApi — React hook + provider for a shared authenticated
 * Axios instance.
 *
 * The provider creates a single AxiosInstance via createAuthenticatedApiClient
 * using the baseUrl from SuiteConfigProvider. All component libraries consume
 * the same instance through the useAuthenticatedApi() hook, eliminating
 * duplicate axios instances and circular dependency issues.
 *
 * Usage:
 *   // In the app root (wrap inside SuiteConfigProvider):
 *   <AuthenticatedApiProvider>
 *     <App />
 *   </AuthenticatedApiProvider>
 *
 *   // In any component library:
 *   const api = useAuthenticatedApi();
 *   const res = await api.get('/some-endpoint');
 */

import { createContext, ReactNode, useContext, useMemo } from 'react';
import type { AxiosInstance } from 'axios';
import { createAuthenticatedApiClient } from '../services/authenticatedApi';
import { useSuiteConfig } from '../contexts/SuiteConfigProvider';

const AuthenticatedApiContext = createContext<AxiosInstance | undefined>(
  undefined,
);

export interface AuthenticatedApiProviderProps {
  children: ReactNode;
  /** Optional token key in localStorage. Defaults to 'authToken'. */
  tokenKey?: string;
}

export const AuthenticatedApiProvider = ({
  children,
  tokenKey,
}: AuthenticatedApiProviderProps) => {
  const { baseUrl } = useSuiteConfig();

  const api = useMemo(
    () => createAuthenticatedApiClient(baseUrl, tokenKey),
    [baseUrl, tokenKey],
  );

  return (
    <AuthenticatedApiContext.Provider value={api}>
      {children}
    </AuthenticatedApiContext.Provider>
  );
};

/**
 * Returns the shared authenticated Axios instance.
 * Must be used within an AuthenticatedApiProvider (which itself must be
 * inside a SuiteConfigProvider).
 */
export const useAuthenticatedApi = (): AxiosInstance => {
  const context = useContext(AuthenticatedApiContext);
  if (!context) {
    throw new Error(
      'useAuthenticatedApi must be used within an AuthenticatedApiProvider',
    );
  }
  return context;
};
