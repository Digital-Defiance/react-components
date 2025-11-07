import {
  CoreLanguageCode,
  GlobalActiveContext,
  IActiveContext,
  LanguageRegistry,
  I18nEngine,
} from '@digitaldefiance/i18n-lib';
import { createContext, FC, ReactNode, useCallback, useContext, useState } from 'react';

export interface I18nProviderProps {
  children: ReactNode;
  i18nEngine: I18nEngine;
  onLanguageChange?: (language: CoreLanguageCode) => Promise<void>;
}

export interface I18nContextType {
  t: (key: string, vars?: Record<string, string | number>, language?: CoreLanguageCode) => string;
  tComponent: <TStringKey extends string>(componentId: string, stringKey: TStringKey) => string;
  changeLanguage: (language: CoreLanguageCode) => void;
  currentLanguage: CoreLanguageCode;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: FC<I18nProviderProps> = ({
  children,
  i18nEngine,
  onLanguageChange,
}) => {
  const context = GlobalActiveContext.getInstance<
    CoreLanguageCode,
    IActiveContext<CoreLanguageCode>
  >();
  const [currentLanguage, setCurrentLanguage] = useState<CoreLanguageCode>(
    context.userLanguage
  );

  const changeLanguage = useCallback(
    async (language: CoreLanguageCode) => {
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

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>, language?: CoreLanguageCode) => {
      return i18nEngine.t(key, vars, language);
    },
    [i18nEngine]
  );

  const tComponent = useCallback(
    <TStringKey extends string>(componentId: string, stringKey: TStringKey): string => {
      return i18nEngine.translate(componentId, stringKey, undefined, currentLanguage);
    },
    [currentLanguage, i18nEngine]
  );

  const value = {
    t,
    tComponent,
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
