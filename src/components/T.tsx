// src/app/components/T.tsx

import { useMemo } from 'react';
import { useI18n } from '../contexts';

interface FCParams<TEnum extends string> {
  stringKey: TEnum;
  vars?: Record<string, string | number>;
}

export const Tbranded = <TEnum extends string>({
  stringKey,
  vars,
}: FCParams<TEnum>): string | undefined => {
  const { currentLanguage, tBranded } = useI18n();
  const translated = useMemo(
    () => tBranded<TEnum>(stringKey, vars, currentLanguage),
    [tBranded, stringKey, vars, currentLanguage]
  );

  return translated;
};

export default Tbranded;
