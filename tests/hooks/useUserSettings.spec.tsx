import { EmailString } from '@digitaldefiance/ecies-lib';
import { CurrencyCode, I18nEngine, Timezone } from '@digitaldefiance/i18n-lib';
import { IUserSettings } from '@digitaldefiance/suite-core-lib';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { I18nProvider } from '../../src/contexts/I18nProvider';
import { SuiteConfigProvider } from '../../src/contexts/SuiteConfigProvider';
import { AppThemeProvider } from '../../src/contexts/ThemeProvider';
import {
  UserSettingsValues,
  useUserSettings,
  useUserSettingsPublic,
} from '../../src/hooks/useUserSettings';

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
          <AppThemeProvider>{children}</AppThemeProvider>
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
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(undefined as any), 100)
        )
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
      expect(response.errors[0]).toEqual({
        path: 'email',
        msg: 'Invalid email',
      });
    }
  });
});

describe('useUserSettings (internal hook)', () => {
  const mockPost = jest.fn().mockResolvedValue({ data: {} });
  const mockAuthenticatedApi = {
    post: mockPost,
  };

  const wrapper = ({ children }: { children: ReactNode }) => {
    const engine = I18nEngine.getInstance('default');
    return (
      <SuiteConfigProvider baseUrl="https://api.test.com">
        <I18nProvider i18nEngine={engine}>
          <AppThemeProvider>{children}</AppThemeProvider>
        </I18nProvider>
      </SuiteConfigProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockResolvedValue({ data: {} });
  });

  it('calls API when authenticated and settings have email', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: true,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        email: new EmailString('test@example.com'),
        darkMode: true,
        timezone: new Timezone('America/New_York'),
        siteLanguage: 'en-US',
        currency: new CurrencyCode('USD'),
        directChallenge: false,
      });
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/user/settings', {
      email: 'test@example.com',
      darkMode: true,
      timezone: 'America/New_York',
      siteLanguage: 'en-US',
      currency: 'USD',
      directChallenge: false,
    });
  });

  it('does NOT call API when not authenticated', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: false,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        email: new EmailString('test@example.com'),
        darkMode: true,
        timezone: new Timezone('America/New_York'),
        siteLanguage: 'en-US',
        currency: new CurrencyCode('USD'),
        directChallenge: false,
      });
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('does NOT call API when authenticated but email is missing', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: true,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        darkMode: true,
        timezone: new Timezone('America/New_York'),
        siteLanguage: 'en-US',
        currency: new CurrencyCode('USD'),
      });
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('updates theme mode when darkMode setting changes', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: true,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        email: new EmailString('test@example.com'),
        darkMode: true,
      });
    });

    // The theme should be updated (tested via ThemeProvider integration)
    expect(mockPost).toHaveBeenCalled();
  });

  it('changes language when siteLanguage setting changes', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: true,
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        email: new EmailString('test@example.com'),
        siteLanguage: 'es',
      });
    });

    await waitFor(() => {
      expect(result.current.currentLanguage).toBe('es');
    });

    expect(mockPost).toHaveBeenCalled();
  });

  it('toggleColorMode switches darkMode state when authenticated', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: true,
        }),
      { wrapper }
    );

    // Set initial state with darkMode false
    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        email: new EmailString('test@example.com'),
        darkMode: false,
      });
    });

    mockPost.mockClear();

    // Toggle dark mode
    await act(async () => {
      await result.current.toggleColorMode();
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/user/settings',
      expect.objectContaining({
        darkMode: true,
      })
    );
  });

  it('maintains settings state across multiple updates', async () => {
    const { result } = renderHook(
      () =>
        useUserSettings({
          authenticatedApi: mockAuthenticatedApi,
          isAuthenticated: true,
        }),
      { wrapper }
    );

    // First update
    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        email: new EmailString('test@example.com'),
        darkMode: false,
        timezone: new Timezone('UTC'),
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/user/settings',
      expect.objectContaining({
        email: 'test@example.com',
        darkMode: false,
        timezone: 'UTC',
      })
    );

    mockPost.mockClear();

    // Second update - should merge with previous
    await act(async () => {
      await result.current.setUserSettingAndUpdateSettings({
        darkMode: true,
      });
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/user/settings',
      expect.objectContaining({
        email: 'test@example.com',
        darkMode: true,
        timezone: 'UTC',
      })
    );
  });
});
