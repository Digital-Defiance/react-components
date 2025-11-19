import { LanguageRegistry, LanguageDefinition } from '@digitaldefiance/i18n-lib';
import { Button, Menu, MenuItem } from '@mui/material';
import { FC, MouseEvent, useState, useMemo } from 'react';
import { Flag } from './Flag';
import { useUserSettings } from '../hooks';
import { createAuthenticatedApiClient } from '../services';
import { useSuiteConfig } from '../contexts';

export const UserLanguageSelector: FC = () => {
  const { baseUrl } = useSuiteConfig();
  const authenticatedApi = useMemo(() => createAuthenticatedApiClient(baseUrl), [baseUrl]);
  const { currentLanguage, changeLanguage } = useUserSettings({ authenticatedApi });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
    handleClose();
  };

  return (
    <>
      <Button onClick={handleClick}>
        <Flag language={currentLanguage} />
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

export default UserLanguageSelector;