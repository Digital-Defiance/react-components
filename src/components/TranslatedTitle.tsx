// src/app/components/TranslatedTitle.tsx

import { useEffect } from 'react';
import { useI18n } from '../contexts';

interface FCParams<TEnum extends string> {
  componentId: string;
  stringKey: TEnum;
  vars?: Record<string, string | number>;
}

export const TranslatedTitle = <TEnum extends string>({
  componentId,
  stringKey,
  vars,
}: FCParams<TEnum>): null => {
  const { tComponent, currentLanguage } = useI18n();

  useEffect(() => {
    document.title = tComponent<TEnum>(
      componentId,
      stringKey,
      vars,
      currentLanguage
    );
  }, [tComponent, componentId, stringKey, vars, currentLanguage]);

  return null;
};

export default TranslatedTitle;
