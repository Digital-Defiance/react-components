import { describe, it, expect } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { SuiteConfigProvider, useSuiteConfig } from '../../src/contexts/SuiteConfigProvider';
import { ReactNode } from 'react';

describe('SuiteConfigProvider', () => {
  const defaultConfig = {
    baseUrl: 'https://api.example.com',
  };

  const wrapper = ({ children, ...props }: { children: ReactNode; [key: string]: any }) => (
    <SuiteConfigProvider {...defaultConfig} {...props}>
      {children}
    </SuiteConfigProvider>
  );

  it('provides baseUrl from props', () => {
    const { result } = renderHook(() => useSuiteConfig(), {
      wrapper: (props) => wrapper({ ...props, baseUrl: 'https://test.com' }),
    });

    expect(result.current.baseUrl).toBe('https://test.com');
  });

  it('provides default routes', () => {
    const { result } = renderHook(() => useSuiteConfig(), { wrapper });

    expect(result.current.routes).toEqual({
      dashboard: '/dashboard',
      login: '/login',
      register: '/register',
      verifyEmail: '/verify-email',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password',
      settings: '/settings',
    });
  });

  it('allows overriding specific routes', () => {
    const { result } = renderHook(() => useSuiteConfig(), {
      wrapper: (props) =>
        wrapper({
          ...props,
          routes: {
            dashboard: '/custom-dashboard',
            login: '/auth/login',
          },
        }),
    });

    expect(result.current.routes).toEqual({
      dashboard: '/custom-dashboard',
      login: '/auth/login',
      register: '/register',
      verifyEmail: '/verify-email',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password',
      settings: '/settings',
    });
  });

  it('provides default languages', () => {
    const { result } = renderHook(() => useSuiteConfig(), { wrapper });

    expect(result.current.languages).toEqual([
      { code: 'en-US', label: 'English (US)' },
      { code: 'en-GB', label: 'English (UK)' },
      { code: 'es-ES', label: 'Español' },
      { code: 'fr-FR', label: 'Français' },
      { code: 'de-DE', label: 'Deutsch' },
      { code: 'ja', label: '日本語' },
      { code: 'zh-CN', label: '中文 (简体)' },
      { code: 'uk', label: 'Українська' },
    ]);
  });

  it('allows custom languages', () => {
    const customLanguages = [
      { code: 'en-US', label: 'English' },
      { code: 'ja-JP', label: '日本語' },
    ];

    const { result } = renderHook(() => useSuiteConfig(), {
      wrapper: (props) => wrapper({ ...props, languages: customLanguages }),
    });

    expect(result.current.languages).toEqual(customLanguages);
  });

  it('allows custom timezones', () => {
    const customTimezones = ['UTC', 'America/New_York', 'Europe/London'];

    const { result } = renderHook(() => useSuiteConfig(), {
      wrapper: (props) => wrapper({ ...props, timezones: customTimezones }),
    });

    expect(result.current.timezones).toEqual(customTimezones);
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useSuiteConfig());
    }).toThrow('useSuiteConfig must be used within a SuiteConfigProvider');

    console.error = originalError;
  });

  it('provides all config values simultaneously', () => {
    const config = {
      baseUrl: 'https://api.test.com',
      routes: { dashboard: '/home' },
      languages: [{ code: 'en', label: 'English' }],
      timezones: ['UTC'],
    };

    const { result } = renderHook(() => useSuiteConfig(), {
      wrapper: (props) => wrapper({ ...props, ...config }),
    });

    expect(result.current.baseUrl).toBe('https://api.test.com');
    expect(result.current.routes.dashboard).toBe('/home');
    expect(result.current.languages).toEqual([{ code: 'en', label: 'English' }]);
    expect(result.current.timezones).toEqual(['UTC']);
  });
});
