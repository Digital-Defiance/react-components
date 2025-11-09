// src/app/components/TranslatedTitle.tsx

import { useEffect } from 'react';
import { useI18n } from '../contexts';

interface FCParams<TEnum extends string> {
  componentId: string;
  stringKey: TEnum;
} 

const TranslatedTitle = <TEnum extends string>({ componentId, stringKey }: FCParams<TEnum>): null => {
  const { t, tComponent, currentLanguage } = useI18n();

  useEffect(() => {
      document.title = t(tComponent(componentId, stringKey), undefined, currentLanguage);
  }, [t, tComponent, componentId, stringKey, currentLanguage]);

  return null;
};

export default TranslatedTitle;
