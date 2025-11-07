import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { FC, ReactNode, useState } from 'react';
import { SideMenu } from './SideMenu';
import { IMenuOption } from '../interfaces';

export interface TopMenuProps {
  title: string;
  logo?: string;
  logoAlt?: string;
  isAuthenticated?: boolean;
  menuOptions: IMenuOption[];
  authenticatedButtons?: ReactNode;
  unauthenticatedButtons?: ReactNode;
  rightContent?: ReactNode;
  onNavigate?: (link: string | { pathname: string; state?: any }) => void;
}

export const TopMenu: FC<TopMenuProps> = ({
  title,
  logo,
  logoAlt,
  isAuthenticated = false,
  menuOptions,
  authenticatedButtons,
  unauthenticatedButtons,
  rightContent,
  onNavigate,
}) => {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  return (
    <AppBar position="fixed" sx={{ top: 10 }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={() => setIsSideMenuOpen(true)}
        >
          <MenuIcon />
        </IconButton>
        {logo && (
          <Box
            component="img"
            sx={{ height: 40, width: 40, marginRight: 2 }}
            alt={logoAlt || 'Logo'}
            src={logo}
          />
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? authenticatedButtons : unauthenticatedButtons}
          {rightContent}
        </Box>
      </Toolbar>
      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        menuOptions={menuOptions}
        onNavigate={onNavigate}
      />
    </AppBar>
  );
};
