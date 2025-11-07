import { Button, Menu, MenuItem } from '@mui/material';
import { FC, MouseEvent, useState } from 'react';
import { Flag } from './Flag';

export interface LanguageOption {
  code: string;
  name: string;
  countryCode: string;
}

export interface UserLanguageSelectorProps {
  currentLanguage: string;
  currentCountryCode: string;
  languages: LanguageOption[];
  onLanguageChange: (languageCode: string) => void;
}

export const UserLanguageSelector: FC<UserLanguageSelectorProps> = ({
  currentLanguage,
  currentCountryCode,
  languages,
  onLanguageChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    onLanguageChange(languageCode);
    handleClose();
  };

  return (
    <>
      <Button onClick={handleClick}>
        <Flag languageCode={currentLanguage} countryCode={currentCountryCode} />
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {languages.map((lang) => (
          <MenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
            <Flag languageCode={lang.code} countryCode={lang.countryCode} sx={{ mr: 1 }} />{' '}
            {lang.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
