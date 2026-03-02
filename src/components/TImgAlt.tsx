// src/app/components/TImgAlt.tsx

import { DetailedHTMLProps, ImgHTMLAttributes, ReactElement, useMemo } from 'react';
import { useI18n } from '../contexts';

interface FCParams<TEnum extends string> {
  src: string;
  stringKey: TEnum;
  vars?: Record<string, string | number>;
  imgOptions?: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
}

export const TImgAlt = <TEnum extends string>({
  src,
  stringKey,
  vars,
  imgOptions,
}: FCParams<TEnum>): ReactElement => {
  const { currentLanguage, tBranded } = useI18n();
  const translated = useMemo(
    () => tBranded<TEnum>(stringKey, vars, currentLanguage),
    [tBranded, stringKey, vars, currentLanguage]
  );

  return <img src={src} {...imgOptions} alt={translated} />;
};

export default TImgAlt;
