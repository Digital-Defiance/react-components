// src/app/components/TDiv.tsx

import { DetailedHTMLProps, HTMLAttributes, ReactElement, useMemo } from 'react';
import { useI18n } from '../contexts';

interface FCParams<TEnum extends string> {
  stringKey: TEnum;
  vars?: Record<string, string | number>;
  divOptions?: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
}

export const TDivBranded = <TEnum extends string>({
  stringKey,
  vars,
  divOptions,
}: FCParams<TEnum>): ReactElement => {
  const { currentLanguage, tBranded } = useI18n();
  const translated = useMemo(
    () => tBranded<TEnum>(stringKey, vars, currentLanguage),
    [tBranded, stringKey, vars, currentLanguage]
  );

  return <div {...divOptions}>{translated}</div>;
};

export default TDivBranded;
