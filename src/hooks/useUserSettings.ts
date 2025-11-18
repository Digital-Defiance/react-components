import { useCallback, useEffect, useMemo, useState } from 'react';
import { createAuthenticatedApiClient } from '../services';
import { useSuiteConfig } from '../contexts';
import { useAuth, useTheme } from '../contexts';
import { CurrencyCode } from '@digitaldefiance/i18n-lib';
import { getSuiteCoreTranslation, SuiteCoreStringKey, TranslatableSuiteError } from '@digitaldefiance/suite-core-lib';

export interface UserSettingsValues {
  email: string;
  timezone: string;
  siteLanguage: string;
  currency: string;
  darkMode: boolean;
  directChallenge: boolean;
  [key: string]: any;
}

export interface UseUserSettingsResult {
  settings: UserSettingsValues | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (values: UserSettingsValues) => Promise<{
    success: boolean;
    message: string;
  } | {
    error: string;
    errorType?: string;
    field?: string;
    errors?: Array<{ path: string; msg: string }>;
  }>;
  refreshSettings: () => Promise<void>;
}

export const useUserSettings = (): UseUserSettingsResult => {
  const { baseUrl } = useSuiteConfig();
  const { userData, setCurrencyCode, setLanguage } = useAuth();
  const { setColorMode } = useTheme();
  const api = useMemo(() => createAuthenticatedApiClient(baseUrl), [baseUrl]);
  const [settings, setSettings] = useState<UserSettingsValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<{ settings: UserSettingsValues }>('/user/settings');
      if (result?.data?.settings) {
        setSettings(result.data.settings);
      } else {
        // Fallback to userData - use current value without dependency
        const fallback = {
          email: userData?.email || '',
          timezone: userData?.timezone || 'UTC',
          siteLanguage: userData?.siteLanguage || 'en-US',
          currency: userData?.currency || 'USD',
          darkMode: userData?.darkMode || false,
          directChallenge: userData?.directChallenge || false,
        };
        setSettings(fallback);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new TranslatableSuiteError(SuiteCoreStringKey.Settings_RetrieveFailure));
      // Use fallback from userData
      const fallback = {
        email: userData?.email || '',
        timezone: userData?.timezone || 'UTC',
        siteLanguage: userData?.siteLanguage || 'en-US',
        currency: userData?.currency || 'USD',
        darkMode: userData?.darkMode || false,
        directChallenge: userData?.directChallenge || false,
      };
      setSettings(fallback);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]); // userData intentionally omitted to prevent infinite loops

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = async (values: UserSettingsValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post('/user/settings', values);
      
      // Update context values
      if (values.currency) {
        await setCurrencyCode(new CurrencyCode(values.currency));
      }
      if (values.siteLanguage) {
        await setLanguage(values.siteLanguage);
      }
      if (values.darkMode !== userData?.darkMode) {
        setColorMode(values.darkMode ? 'dark' : 'light');
      }
      
      // Update local state
      setSettings(values);
      
      return { 
        success: true, 
        message: result.data.message || getSuiteCoreTranslation(SuiteCoreStringKey.Settings_SaveSuccess)
      };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || getSuiteCoreTranslation(SuiteCoreStringKey.Settings_UpdateFailed);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return { 
        error: errorMessage,
        errorType: err.response?.data?.errorType,
        field: err.response?.data?.field,
        errors: err.response?.data?.errors,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings,
  };
};
