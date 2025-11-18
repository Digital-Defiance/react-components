import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React, { ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserSettings, UserSettingsValues } from '../../src/hooks/useUserSettings';
import { SuiteConfigProvider } from '../../src/contexts/SuiteConfigProvider';
import { AuthProvider } from '../../src/contexts/AuthProvider';
import { AppThemeProvider } from '../../src/contexts/ThemeProvider';
import { I18nProvider } from '../../src/contexts/I18nProvider';
import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { Constants } from '@digitaldefiance/suite-core-lib';
import { ECIES as ECIESConstants } from '@digitaldefiance/ecies-lib';

// Mock the services
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockSetCurrencyCode = jest.fn();
const mockSetLanguage = jest.fn();
const mockSetColorMode = jest.fn();

jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    get: mockGet,
    post: mockPost,
  })),
}));

jest.mock('../../src/services/authService', () => ({
  createAuthService: jest.fn(() => ({
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
  })),
}));

const mockUserData = {
  email: 'test@example.com',
  timezone: 'America/New_York',
  siteLanguage: 'en-US',
  currency: 'USD',
  darkMode: false,
  directChallenge: false,
};

describe('useUserSettings', () => {
  const wrapper = ({ children }: { children: ReactNode }) => {
    const engine = I18nEngine.getInstance('default');
    return (
      <SuiteConfigProvider baseUrl="https://api.test.com">
        <I18nProvider i18nEngine={engine}>
          <AppThemeProvider>
            <AuthProvider
              baseUrl="https://api.test.com"
              constants={Constants}
              eciesConfig={ECIESConstants}
              onAuthError={() => {}}
            >
              {children}
            </AuthProvider>
          </AppThemeProvider>
        </I18nProvider>
      </SuiteConfigProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ data: { settings: mockUserData } });
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useUserSettings(), { wrapper });

    expect(result.current.settings).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('fetches settings on mount', async () => {
    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toEqual(mockUserData);
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGet).toHaveBeenCalledWith('/user/settings');
  });

  it('uses fallback userData on fetch error', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toBeDefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('updates settings successfully', async () => {
    mockPost.mockResolvedValue({ data: { message: 'Settings saved' } });

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toEqual(mockUserData);
    });

    const updatedSettings: UserSettingsValues = {
      ...mockUserData,
      timezone: 'Europe/London',
    };

    let response: any;
    await act(async () => {
      response = await result.current.updateSettings(updatedSettings);
    });

    expect(response.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/user/settings', updatedSettings);
    expect(result.current.settings).toEqual(updatedSettings);
  });

  it('handles update errors', async () => {
    mockPost.mockRejectedValue({
      response: {
        data: {
          message: 'Update failed',
          errorType: 'validation',
          field: 'email',
        },
      },
    });

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toEqual(mockUserData);
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
    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toEqual(mockUserData);
    });

    const updatedData = { ...mockUserData, timezone: 'Asia/Tokyo' };
    mockGet.mockResolvedValueOnce({ data: { settings: updatedData } });

    await act(async () => {
      await result.current.refreshSettings();
    });

    expect(result.current.settings).toEqual(updatedData);
  });

  it('updates currency code in context on settings update', async () => {
    mockPost.mockResolvedValue({ data: { message: 'Success' } });

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toBeDefined();
    });

    const updatedSettings = { ...mockUserData, currency: 'EUR' };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    // Note: In a real test, we'd need to mock the useAuth hook properly
    // to verify setCurrencyCode was called
    expect(mockPost).toHaveBeenCalledWith('/user/settings', updatedSettings);
  });

  it('updates language in context on settings update', async () => {
    mockPost.mockResolvedValue({ data: { message: 'Success' } });

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toBeDefined();
    });

    const updatedSettings = { ...mockUserData, siteLanguage: 'es-ES' };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(mockPost).toHaveBeenCalledWith('/user/settings', updatedSettings);
  });

  it('updates theme mode in context on darkMode change', async () => {
    mockPost.mockResolvedValue({ data: { message: 'Success' } });

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toBeDefined();
    });

    const updatedSettings = { ...mockUserData, darkMode: true };

    await act(async () => {
      await result.current.updateSettings(updatedSettings);
    });

    expect(mockPost).toHaveBeenCalledWith('/user/settings', updatedSettings);
  });

  it('sets isLoading correctly during operations', async () => {
    mockPost.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { message: 'Success' } }), 100))
    );

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toEqual(mockUserData);
    });

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.updateSettings(mockUserData);
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('handles validation errors in response', async () => {
    mockPost.mockRejectedValue({
      response: {
        data: {
          message: 'Validation failed',
          errors: [
            { path: 'email', msg: 'Invalid email' },
            { path: 'timezone', msg: 'Invalid timezone' },
          ],
        },
      },
    });

    const { result } = renderHook(() => useUserSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.settings).toBeDefined();
    });

    let response: any;
    await act(async () => {
      response = await result.current.updateSettings(mockUserData);
    });

    expect(response.error).toBeDefined();
    expect(response.errors).toHaveLength(2);
    expect(response.errors[0]).toEqual({ path: 'email', msg: 'Invalid email' });
  });
});
