// src/app/components/TranslatedTitle.tsx

import { useEffect } from 'react';
import { useI18n } from '../contexts';
import { SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';

interface FCParams<TEnum extends string> {
  componentId: string;
  stringKey: TEnum;
} 

export const TranslatedTitle = <TEnum extends string>({ componentId, stringKey }: FCParams<TEnum>): null => {
  const { tComponent, currentLanguage } = useI18n();

  useEffect(() => {
      document.title = tComponent<TEnum>(componentId, stringKey, undefined, currentLanguage);
  }, [tComponent, componentId, stringKey, currentLanguage]);

  return null;
};

export default TranslatedTitle;
