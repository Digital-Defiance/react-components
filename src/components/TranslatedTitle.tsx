import { FC, useEffect } from 'react';

export interface TranslatedTitleProps {
  title: string;
  language?: string;
}

export const TranslatedTitle: FC<TranslatedTitleProps> = ({ title, language }) => {
  useEffect(() => {
    document.title = title;
  }, [title, language]);

  return null;
};
