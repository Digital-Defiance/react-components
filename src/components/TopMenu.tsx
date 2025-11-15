import MenuIcon from '@mui/icons-material/Menu';
import { DropdownMenu } from './DropdownMenu';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import React, { FC, ReactElement, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import { useI18n } from '../contexts/I18nProvider';
import { IAppConfig } from '../interfaces/AppConfig';
import { SideMenu } from './SideMenu';
import { UserLanguageSelector } from './UserLanguageSelector';
import { UserMenu } from './UserMenu';
import { SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';
import { MenuType, MenuTypes } from '../types/MenuType';

export interface AdditionalDropdownMenu {
  menuType: MenuType;
  menuIcon: ReactElement;
  priority?: number;
}

export interface TopMenuProps {
  Logo: React.ReactNode;
  additionalMenus?: Array<AdditionalDropdownMenu>;
}

export const TopMenu: FC<TopMenuProps> = ({ Logo, additionalMenus }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const handleOpenSideMenu = () => setIsSideMenuOpen(true);
  const handleCloseSideMenu = () => setIsSideMenuOpen(false);
  const { t, tComponent } = useI18n();
  const appConfig: IAppConfig | undefined =
    'APP_CONFIG' in window
      ? ((window as any).APP_CONFIG as IAppConfig)
      : undefined;
  const siteTitle = t(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_SiteTemplate));

  return (
    <AppBar position="fixed" sx={{ top: 10 }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={handleOpenSideMenu}
        >
          <MenuIcon />
        </IconButton>
        <Box
          sx={{
            height: 40,
            width: 40,
            marginRight: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {Logo}
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {siteTitle}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                {t(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_Dashboard))}
              </Button>
              {[
                ...additionalMenus?.map((menu, index) => ({ ...menu, key: `custom-${index}`, isUserMenu: false })) ?? [],
                { menuType: MenuTypes.UserMenu, menuIcon: <></>, priority: 0, key: 'user-menu', isUserMenu: true }
              ]
                .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
                .map(menu => 
                  menu.isUserMenu ? <UserMenu key={menu.key} /> : <DropdownMenu key={menu.key} menuType={menu.menuType} menuIcon={menu.menuIcon} />
                )}
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                {t(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Login_LoginButton))}
              </Button>
              <Button color="inherit" component={Link} to="/register">
                {t(tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.RegisterButton))}
              </Button>
            </>
          )}
          <UserLanguageSelector />
        </Box>
      </Toolbar>
      <SideMenu isOpen={isSideMenuOpen} onClose={handleCloseSideMenu} />
    </AppBar>
  );
};

export default TopMenu;
