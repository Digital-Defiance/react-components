import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import type { InternalAxiosRequestConfig } from 'axios';
import { ReactNode } from 'react';
import {
  GlobalActiveContext,
  IActiveContext,
  LanguageRegistry,
} from '@digitaldefiance/i18n-lib';
import {
  I18nProvider,
  II18nEngineCompat,
  useI18n,
} from '../../src/contexts/I18nProvider';
import { createApiClient } from '../../src/services/api';
import { createAuthenticatedApiClient } from '../../src/services/authenticatedApi';
import { resolvePreferredLanguageCode } from '../../src/services/language-preference';

function registerBundledStyleLanguages() {
  LanguageRegistry.clear();
  LanguageRegistry.registerLanguages([
    { id: 'en-US', name: 'English (US)', code: 'en-US', isDefault: true },
    { id: 'fr', name: 'Français', code: 'fr' },
    { id: 'es', name: 'Español', code: 'es' },
  ]);
  LanguageRegistry.setDefaultLanguage('en-US');
}

/** Runs the client's request interceptors without any network I/O and returns the sent headers. */
async function captureHeaders(
  client: ReturnType<typeof createApiClient>
): Promise<InternalAxiosRequestConfig['headers']> {
  let sent: InternalAxiosRequestConfig['headers'] | undefined;
  client.defaults.adapter = async (config) => {
    sent = config.headers;
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  await client.get('/ping');
  if (!sent) throw new Error('request was not sent');
  return sent;
}

function makeEngine() {
  const setLanguage = jest.fn<(language: string) => void>();
  const engine: II18nEngineCompat = {
    setLanguage,
    translate: () => '',
  };
  return { engine, setLanguage };
}

// tests/setup.ts replaces localStorage with bare jest.fn()s; back them with a real store here.
const store = new Map<string, string>();

describe('initial language agrees between I18nProvider and API clients', () => {
  beforeEach(() => {
    store.clear();
    jest.mocked(localStorage.getItem).mockImplementation((key: string) => store.get(key) ?? null);
    jest.mocked(localStorage.setItem).mockImplementation((key: string, value: string) => {
      store.set(key, value);
    });
    registerBundledStyleLanguages();
    GlobalActiveContext.getInstance<string, IActiveContext<string>>().userLanguage =
      'en-US';
  });

  afterEach(() => {
    store.clear();
    jest.mocked(localStorage.getItem).mockReset();
    jest.mocked(localStorage.setItem).mockReset();
    LanguageRegistry.clear();
  });

  function renderProvider(engine: II18nEngineCompat) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider i18nEngine={engine}>{children}</I18nProvider>
    );
    return renderHook(() => useI18n(), { wrapper });
  }

  it('starts the provider in the persisted language ("fr") and sends the same Accept-Language', async () => {
    localStorage.setItem('languageCode', 'fr');
    const { engine, setLanguage } = makeEngine();

    const { result } = renderProvider(engine);

    expect(result.current.currentLanguage).toBe('fr');
    expect(setLanguage).toHaveBeenCalledWith('fr');
    expect(
      GlobalActiveContext.getInstance<string, IActiveContext<string>>().userLanguage
    ).toBe('fr');

    const headers = await captureHeaders(createApiClient('http://localhost'));
    expect(headers['Accept-Language']).toBe('fr');
    const authHeaders = await captureHeaders(
      createAuthenticatedApiClient('http://localhost')
    );
    expect(authHeaders['Accept-Language']).toBe('fr');
  });

  it('resolves a regional preference ("fr-FR") to the registered code in both places', async () => {
    localStorage.setItem('languageCode', 'fr-FR');
    const { engine } = makeEngine();

    const { result } = renderProvider(engine);

    expect(result.current.currentLanguage).toBe('fr');
    const headers = await captureHeaders(createApiClient('http://localhost'));
    expect(headers['Accept-Language']).toBe('fr');
  });

  it('uses the same default in both places when nothing is stored', async () => {
    const { engine } = makeEngine();
    const { result } = renderProvider(engine);

    expect(result.current.currentLanguage).toBe('en-US');
    const headers = await captureHeaders(createApiClient('http://localhost'));
    expect(headers['Accept-Language']).toBe('en-US');
  });

  it('ignores a stored language that is not registered', () => {
    localStorage.setItem('languageCode', 'xx');
    expect(resolvePreferredLanguageCode('es')).toBe('es');
    expect(resolvePreferredLanguageCode()).toBe('en-US');
  });

  it('falls back to the stored value (or en-US) when no registry is configured', () => {
    LanguageRegistry.clear();
    expect(resolvePreferredLanguageCode()).toBe('en-US');
    localStorage.setItem('languageCode', 'de');
    expect(resolvePreferredLanguageCode()).toBe('de');
  });
});
