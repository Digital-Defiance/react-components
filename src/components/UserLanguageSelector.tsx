import { LanguageRegistry, LanguageDefinition } from '@digitaldefiance/i18n-lib';
import { Button, Menu, MenuItem } from '@mui/material';
import { FC, MouseEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { Flag } from './Flag';

export const UserLanguageSelector: FC = () => {
  const { language, setLanguage } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    handleClose();
  };

  return (
    <>
      <Button onClick={handleClick}>
        <Flag language={language} />
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {Object.values(LanguageRegistry.getAllLanguages()).map((lang: LanguageDefinition) => (
          <MenuItem key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
            <Flag language={lang.code} sx={{ mr: 1 }} /> {lang.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
