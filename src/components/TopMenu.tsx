import {
  Constants,
  IConstants,
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  SuiteCoreStringKeyValue,
} from '@digitaldefiance/suite-core-lib';
import MenuIcon from '@mui/icons-material/Menu';
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import React, { ElementType, FC, ReactElement, useContext, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import { useI18n } from '../contexts/I18nProvider';
import { useMenu } from '../contexts/MenuContext';
import { MenuType } from '../types/MenuType';
import { DropdownMenu } from './DropdownMenu';
import { SideMenu } from './SideMenu';
import { UserLanguageSelector } from './UserLanguageSelector';
import { UserMenu } from './UserMenu';

// Extend Window interface for APP_CONFIG
declare global {
  interface Window {
    APP_CONFIG?: {
      hostname: string;
      siteTitle: string;
      server: string;
      [key: string]: unknown;
    };
  }
}

export interface AdditionalDropdownMenu {
  menuType: MenuType;
  menuIcon: ReactElement;
  priority?: number;
}

export interface TopMenuProps {
  Logo: React.ReactNode;
  additionalMenus?: Array<AdditionalDropdownMenu>;
  constants?: IConstants;
}

export const TopMenu: FC<TopMenuProps> = ({ Logo, additionalMenus, constants }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { getTopMenus } = useMenu();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const handleOpenSideMenu = () => setIsSideMenuOpen(true);
  const handleCloseSideMenu = () => setIsSideMenuOpen(false);
  const { tComponent } = useI18n();
  const siteTitle = tComponent<SuiteCoreStringKeyValue>(
    SuiteCoreComponentId,
    SuiteCoreStringKey.Common_SiteTemplate,
    { Site: (constants ?? Constants).Site }
  );

  const allMenus = useMemo(() => {
    const contextMenus = getTopMenus();
    if (!additionalMenus || additionalMenus.length === 0) {
      return contextMenus;
    }
    const additional = additionalMenus.map((m) => ({
      ...m,
      options: [],
      isUserMenu: false,
    }));
    return [...contextMenus, ...additional].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }, [getTopMenus, additionalMenus]);

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
              <Button
                color="inherit"
                component={Link as ElementType}
                to="/dashboard"
              >
                {tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Common_Dashboard
                )}
              </Button>
              {allMenus.map((menu, index) =>
                menu.isUserMenu ? (
                  <UserMenu key={`user-menu`} />
                ) : (
                  <DropdownMenu
                    key={`menu-${index}`}
                    menuType={menu.menuType}
                    menuIcon={menu.menuIcon as ReactElement}
                  />
                )
              )}
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={Link as ElementType}
                to="/login"
              >
                {tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.Login_LoginButton
                )}
              </Button>
              <Button
                color="inherit"
                component={Link as ElementType}
                to="/register"
              >
                {tComponent<SuiteCoreStringKeyValue>(
                  SuiteCoreComponentId,
                  SuiteCoreStringKey.RegisterButton
                )}
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
