import { LanguageRegistry } from '@digitaldefiance/i18n-lib';

/** localStorage key holding the user's chosen language code. */
export const LANGUAGE_CODE_STORAGE_KEY = 'languageCode';

/** Used only when nothing is stored and no language registry is configured. */
export const FALLBACK_LANGUAGE_CODE = 'en-US';

/**
 * Reads the persisted language code, tolerating environments where
 * localStorage is unavailable (SSR, privacy modes).
 */
export function getStoredLanguageCode(): string | undefined {
  try {
    return localStorage.getItem(LANGUAGE_CODE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the language the app should start in, using one rule for both the
 * UI (I18nProvider) and the API clients (Accept-Language), so they never disagree.
 *
 * The stored preference is matched against the registered languages
 * (case-insensitive, `fr-FR` resolves to a registered `fr`, and the reverse).
 * When nothing matches, `fallback` is tried, then the registry default.
 * Without a configured registry the raw stored value (or fallback) is used.
 *
 * @param fallback - Language to use when the stored preference does not match (e.g. the engine's current language).
 */
export function resolvePreferredLanguageCode(fallback?: string): string {
  const stored = getStoredLanguageCode();
  if (LanguageRegistry.getDefaultLanguageId()) {
    return LanguageRegistry.getMatchingLanguageCode(stored, fallback);
  }
  return stored ?? fallback ?? FALLBACK_LANGUAGE_CODE;
}
