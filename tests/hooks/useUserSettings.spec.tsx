import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserSettingsPublic, UserSettingsValues } from '../../src/hooks/useUserSettings';
import { SuiteConfigProvider } from '../../src/contexts/SuiteConfigProvider';
import { AppThemeProvider } from '../../src/contexts/ThemeProvider';
import { I18nProvider } from '../../src/contexts/I18nProvider';
import { I18nEngine, CurrencyCode, Timezone } from '@digitaldefiance/i18n-lib';
import { IUserSettings } from '@digitaldefiance/suite-core-lib';
import { EmailString } from '@digitaldefiance/ecies-lib';

// Mock the Auth context
const mockSetUserSetting = jest.fn();
const mockUserSettings: IUserSettings = {
  email: new EmailString('test@example.com'),
  timezone: new Timezone('America/New_York'),
  siteLanguage: 'en-US',
  currency: new CurrencyCode('USD'),
  darkMode: false,
  directChallenge: false,
};

const mockAuthContext = {
  isAuthenticated: true,
  userData: {
    email: 'test@example.com',
    timezone: 'America/New_York',
    siteLanguage: 'en-US',
    currency: 'USD',
    darkMode: false,
    directChallenge: false,
  },
  userSettings: mockUserSettings,
  setUserSetting: mockSetUserSetting,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  requestEmailLogin: jest.fn(),
  verifyEmailChallenge: jest.fn(),
  backupCodeLogin: jest.fn(),
  changePassword: jest.fn(),
  isLoading: false,
  error: null,
  getMnemonicRemainingTime: jest.fn(),
  getWalletRemainingTime: jest.fn(),
  isBrowserPasswordLoginAvailable: true,
};

jest.mock('../../src/contexts', () => ({
  ...jest.requireActual('../../src/contexts'),
  useAuth: () => mockAuthContext,
}));

const mockUserData = {
  email: 'test@example.com',
  timezone: 'America/New_York',
  siteLanguage: 'en-US',
  currency: 'USD',
  darkMode: false,
  directChallenge: false,
};

describe('useUserSettingsPublic', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const engine = I18nEngine.getInstance('default');
    return (
      <SuiteConfigProvider baseUrl="https://api.test.com">
        <I18nProvider i18nEngine={engine}>
          <AppThemeProvider>
            {children}
          </AppThemeProvider>
        </I18nProvider>
      </SuiteConfigProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetUserSetting.mockResolvedValue(undefined as any);
    // Reset mock context to default state
    mockAuthContext.userSettings = mockUserSettings;
    mockAuthContext.userData = {
      email: 'test@example.com',
      timezone: 'America/New_York',
      siteLanguage: 'en-US',
      currency: 'USD',
      darkMode: false,
      directChallenge: false,
    };
  });

  it('initializes and loads settings', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    // Wait for settings to be loaded from mocked context
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.settings).toEqual(mockUserData);
  });

  it('fetches settings on mount', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockUserData);
  });

  it('uses fallback userData when userSettings is undefined', async () => {
    mockAuthContext.userSettings = undefined;

    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockUserData);
  });

  it('updates settings successfully', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedSettings: UserSettingsValues = {
      email: 'test@example.com',
      timezone: 'Europe/London',
      siteLanguage: 'en-US',
      currency: 'USD',
      darkMode: false,
      directChallenge: false,
    };

    let response: any;
    await act(async () => {
      response = await result.current.updateSettings(updatedSettings);
    });

    expect(response.success).toBe(true);
    expect(mockSetUserSetting).toHaveBeenCalled();
    expect(result.current.settings).toEqual(updatedSettings);
  });

  it('handles update errors', async () => {
    mockSetUserSetting.mockRejectedValue({
      response: {
        data: {
          message: 'Update failed',
          errorType: 'validation',
          field: 'email',
        },
      },
    } as any);

    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let response: any;
    await act(async () => {
      response = await result.current.updateSettings(mockUserData);
    });

    expect(response.error).toBe('Update failed');
    expect(response.errorType).toBe('validation');
    expect(response.field).toBe('email');
  });

  it('refreshes settings', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedData = {
      email: 'test@example.com',
      timezone: 'Asia/Tokyo',
      siteLanguage: 'en-US',
      currency: 'USD',
      darkMode: false,
      directChallenge: false,
    };

    // Update the mock context
    mockAuthContext.userData = updatedData;
    mockAuthContext.userSettings = {
      ...mockUserSettings,
      timezone: new Timezone('Asia/Tokyo'),
    };

    await act(async () => {
      await result.current.refreshSettings();
    });

    await waitFor(() => {
      expect(result.current.settings).toEqual(updatedData);
    });
  });

  it('updates currency code in context on settings update', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedSettings: UserSettingsValues = {
      email: 'test@example.com',
      timezone: 'America/New_York',
      siteLanguage: 'en-US',
      currency: 'EUR',
      darkMode: false,
      directChallenge: false,
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(mockSetUserSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: expect.any(CurrencyCode),
      })
    );
  });

  it('updates language in context on settings update', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedSettings: UserSettingsValues = {
      email: 'test@example.com',
      timezone: 'America/New_York',
      siteLanguage: 'es-ES',
      currency: 'USD',
      darkMode: false,
      directChallenge: false,
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(mockSetUserSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        siteLanguage: 'es-ES',
      })
    );
  });

  it('updates theme mode in context on darkMode change', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedSettings: UserSettingsValues = {
      email: 'test@example.com',
      timezone: 'America/New_York',
      siteLanguage: 'en-US',
      currency: 'USD',
      darkMode: true,
      directChallenge: false,
    };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(mockSetUserSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        darkMode: true,
      })
    );
  });

  it('sets isLoading correctly during operations', async () => {
    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate a slow update
    mockSetUserSetting.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined as any), 100))
    );

    act(() => {
      result.current.updateSettings(mockUserData);
    });

    // Should be loading during update
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles validation errors in response', async () => {
    mockSetUserSetting.mockRejectedValue({
      response: {
        data: {
          message: 'Validation failed',
          errors: [
            { path: 'email', msg: 'Invalid email' },
            { path: 'timezone', msg: 'Invalid timezone' },
          ],
        },
      },
    } as any);

    const { result } = renderHook(() => useUserSettingsPublic(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let response: any;
    await act(async () => {
      response = await result.current.updateSettings({
        email: 'invalid',
        timezone: 'invalid',
        siteLanguage: 'en-US',
        currency: 'USD',
        darkMode: false,
        directChallenge: false,
      });
    });

    expect(response.error).toBeDefined();
    if (response.errors) {
      expect(response.errors).toHaveLength(2);
      expect(response.errors[0]).toEqual({ path: 'email', msg: 'Invalid email' });
    }
  });
});
