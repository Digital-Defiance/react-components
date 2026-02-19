import {
  GlobalActiveContext,
  IActiveContext,
  LanguageRegistry,
} from '@digitaldefiance/i18n-lib';
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

/**
 * Minimal structural interface accepted by I18nProvider.
 * Both I18nEngine and PluginI18nEngine satisfy this interface.
 */
export interface II18nEngineCompat {
  setLanguage(language: string): void;
  translate(
    componentId: string,
    stringKey: string,
    variables?: Record<string, string | number>,
    language?: string
  ): string;
  t?(
    template: string,
    vars?: Record<string, string | number>,
    language?: string
  ): string;
  translateStringKey?(
    key: string,
    vars?: Record<string, string | number>,
    language?: string
  ): string;
}

export interface I18nProviderProps {
  children: ReactNode;
  i18nEngine: II18nEngineCompat;
  onLanguageChange?: (language: string) => Promise<void>;
}

export interface I18nContextType {
  t: (
    key: string,
    vars?: Record<string, string | number>,
    language?: string
  ) => string;
  tBranded: <TStringKey extends string>(
    stringKey: TStringKey,
    vars?: Record<string, string | number>,
    language?: string
  ) => string;
  tComponent: <TStringKey extends string>(
    componentId: string,
    stringKey: TStringKey,
    vars?: Record<string, string | number>,
    language?: string
  ) => string;
  changeLanguage: (language: string) => void;
  currentLanguage: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: FC<I18nProviderProps> = ({
  children,
  i18nEngine,
  onLanguageChange,
}) => {
  const context = GlobalActiveContext.getInstance<
    string,
    IActiveContext<string>
  >();
  const [currentLanguage, setCurrentLanguage] = useState<string>(
    context.userLanguage
  );

  const changeLanguage = useCallback(
    async (language: string) => {
      const languageDetails = LanguageRegistry.getLanguageByCode(language);
      if (language && languageDetails) {
        context.userLanguage = language;
        i18nEngine.setLanguage(language);
        localStorage.setItem('language', languageDetails.name);
        localStorage.setItem('languageCode', language);
        setCurrentLanguage(language);
        if (onLanguageChange) {
          await onLanguageChange(language);
        }
      }
    },
    [onLanguageChange, i18nEngine, context]
  );

  const tBranded = useCallback(
    (
      key: string,
      vars?: Record<string, string | number>,
      language?: string
    ) => {
      if (!i18nEngine.translateStringKey) return `[${key}]`;
      return i18nEngine.translateStringKey(key, vars, language ?? currentLanguage);
    },
    [i18nEngine, currentLanguage]
  );

  const t = useCallback(
    (
      key: string,
      vars?: Record<string, string | number>,
      language?: string
    ) => {
      if (!i18nEngine.t) return `[${key}]`;
      return i18nEngine.t(key, vars, language ?? currentLanguage);
    },
    [i18nEngine, currentLanguage]
  );

  const tComponent = useCallback(
    <TStringKey extends string>(
      componentId: string,
      stringKey: TStringKey,
      vars?: Record<string, string | number>,
      language?: string
    ): string => {
      return i18nEngine.translate(
        componentId,
        stringKey,
        vars,
        language ?? currentLanguage
      );
    },
    [currentLanguage, i18nEngine]
  );

  const value = {
    t,
    tComponent,
    tBranded,
    changeLanguage,
    currentLanguage,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
