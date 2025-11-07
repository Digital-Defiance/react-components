/**
 * Translation function type for components
 * Accepts a key and optional variables, returns translated string
 */
export type TranslationFunction = (
  key: string,
  variables?: Record<string, string | number>
) => string;

/**
 * Helper to get translated text or fallback to provided string
 */
export function getTranslatedText(
  t: TranslationFunction | undefined,
  key: string,
  fallback: string,
  variables?: Record<string, string | number>
): string {
  return t ? t(key, variables) : fallback;
}
