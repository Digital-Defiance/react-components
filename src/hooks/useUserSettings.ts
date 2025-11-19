import { useCallback, useState, useEffect } from 'react';
import {
  CurrencyCode,
  DefaultCurrencyCode,
  DefaultTimezone,
  DefaultLanguageCode,
  Timezone,
} from '@digitaldefiance/i18n-lib';
import { EmailString } from '@digitaldefiance/ecies-lib';
import {
  IUserSettings,
  dehydrateUserSettings,
  IRequestUserDTO,
  IUserSettingsDTO,
  getSuiteCoreTranslation,
  SuiteCoreStringKey,
  TranslatableSuiteError,
} from '@digitaldefiance/suite-core-lib';
import { useAuth, useI18n, useTheme } from '../contexts';

const defaultUserSettings: Partial<IUserSettings> = {
  darkMode: false,
  currency: new CurrencyCode(DefaultCurrencyCode),
  timezone: new Timezone(DefaultTimezone),
  siteLanguage: DefaultLanguageCode,
  directChallenge: false,
} as const;

export interface UseUserSettingsOptions {
  authenticatedApi: {
    post: (url: string, data: any) => Promise<any>;
  };
}

export interface UseUserSettingsResult {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  userSettings: IUserSettings | undefined;
  setUserSettingAndUpdateSettings: (setting?: Partial<IUserSettings>) => Promise<void>;
  toggleColorMode: () => Promise<void>;
}

/**
 * Hook for managing user settings state and synchronization.
 * Used by AuthProvider to handle user settings logic.
 */
export const useUserSettings = ({
  authenticatedApi,
}: UseUserSettingsOptions): UseUserSettingsResult => {
  const { isAuthenticated } = useAuth();
  const { setColorMode: themeSetPaletteMode } = useTheme();
  const { currentLanguage, changeLanguage } = useI18n();
  const [userSettings, setUserSettings] = useState<IUserSettings | undefined>(undefined);

  const setUserSettingAndUpdateSettings = useCallback(
    async (setting?: Partial<IUserSettings>) => {
      if (setting) {
        // Merge settings with defaults and existing settings
        const merged = {
          ...defaultUserSettings,
          ...(userSettings ? userSettings : {}),
          ...setting,
        };
        
        // TypeScript requires all IUserSettings fields, but during initialization
        // some fields like email may not be set yet. We'll use Partial until
        // all required fields are available.
        setUserSettings(merged as IUserSettings);
        
        if (setting.darkMode !== undefined) {
          themeSetPaletteMode(setting.darkMode ? 'dark' : 'light');
        }
        if (setting.siteLanguage !== undefined && setting.siteLanguage !== currentLanguage) {
          changeLanguage(setting.siteLanguage);
        }
        
        // Send to server if authenticated and we have complete settings (including email)
        if (isAuthenticated && merged.email) {
          const dehydratedSettings = dehydrateUserSettings(merged as IUserSettings);
          await authenticatedApi.post('/user/settings', dehydratedSettings);
        }
      } else {
        setUserSettings(undefined);
        themeSetPaletteMode('light');
      }
    },
    [isAuthenticated, userSettings, currentLanguage, changeLanguage, themeSetPaletteMode, authenticatedApi]
  );

  const changeLanguageSetting = useCallback(
    async (languageCode: string) => {
      await setUserSettingAndUpdateSettings({ siteLanguage: languageCode });
    },
    [setUserSettingAndUpdateSettings]
  );

  const toggleColorMode = async () => {
    const currentDarkMode = userSettings?.darkMode ?? false;
    await setUserSettingAndUpdateSettings({ darkMode: !currentDarkMode });
  };

  return {
    changeLanguage: changeLanguageSetting,
    currentLanguage,
    userSettings,
    setUserSettingAndUpdateSettings,
    toggleColorMode,
  };
};

// Public-facing hook for components
export interface UserSettingsValues extends IUserSettingsDTO {
  [key: string]: any;
}

export interface UseUserSettingsPublicResult {
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

/**
 * Public hook for components to manage user settings.
 * Provides a simpler API for fetching and updating settings.
 */
export const useUserSettingsPublic = (): UseUserSettingsPublicResult => {
  const { userData, setUserSetting, userSettings } = useAuth();
  const [settings, setSettings] = useState<UserSettingsValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (userSettings) {
        const dehydratedSettings = dehydrateUserSettings(userSettings);
        setSettings(dehydratedSettings);
      } else if (userData) {
        const fallback = {
          email: userData.email || '',
          timezone: userData.timezone || 'UTC',
          siteLanguage: userData.siteLanguage || 'en-US',
          currency: userData.currency || 'USD',
          darkMode: userData.darkMode || false,
          directChallenge: userData.directChallenge || false,
        };
        setSettings(fallback);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new TranslatableSuiteError(SuiteCoreStringKey.Settings_RetrieveFailure));
    } finally {
      setIsLoading(false);
    }
  }, [userSettings, userData]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(async (values: UserSettingsValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await setUserSetting({
        darkMode: values.darkMode,
        currency: new CurrencyCode(values.currency),
        timezone: new Timezone(values.timezone),
        siteLanguage: values.siteLanguage,
        email: new EmailString(values.email),
        directChallenge: values.directChallenge,
      });
      
      setSettings(values);
      
      return { 
        success: true, 
        message: getSuiteCoreTranslation(SuiteCoreStringKey.Settings_SaveSuccess)
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
  }, [setUserSetting]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refreshSettings,
  };
};
