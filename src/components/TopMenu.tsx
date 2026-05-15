import {
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
import { ICategoryConfig } from '../interfaces/ICategoryConfig';
import { IMenuConfig } from '../interfaces/IMenuConfig';
import { MenuType } from '../types/MenuType';
import { CategoryMenu } from './CategoryMenu';
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
  /** Optional callback invoked when the icon button is clicked. */
  action?: () => void;
  /** When true, the menu icon is hidden if there are no sub-options. Defaults to false. */
  hideWhenEmpty?: boolean;
  /**
   * Optional category id. When the TopMenu is given matching `categories`,
   * this menu is rendered inside that category's popover instead of inline.
   */
  category?: string;
  /** Optional label used for tile captions and tooltips. */
  label?: string;
}

export interface TopMenuProps {
  Logo: React.ReactNode;
  additionalMenus?: Array<AdditionalDropdownMenu>;
  /**
   * Optional category configurations. When provided, any menu (whether
   * registered via `MenuContext` or passed in `additionalMenus`) whose
   * `category` matches a category `id` is rendered as a tile inside that
   * category's mega-menu popover. Menus without a matching category render
   * inline in the AppBar exactly as before, so this is backwards compatible:
   * omit `categories` (or use empty array) for the original layout.
   */
  categories?: ICategoryConfig[];
  /** Custom action elements rendered in the toolbar after menu dropdowns (e.g. notification bell). Only shown when authenticated. */
  actions?: React.ReactNode;
  constants?: IConstants;
  showTitle?: boolean;
}

export const TopMenu: FC<TopMenuProps> = ({ Logo, additionalMenus, categories, actions, constants, showTitle }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { getTopMenus } = useMenu();
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  const handleOpenSideMenu = () => setIsSideMenuOpen(true);
  const handleCloseSideMenu = () => setIsSideMenuOpen(false);
  const { tComponent } = useI18n();
  // When constants are explicitly provided, pass Site as a template variable
  // override. Otherwise let the i18n engine resolve {Site} from its registered
  // constants (which the consuming app sets up via createI18nSetup).
  const siteTitle = tComponent<SuiteCoreStringKeyValue>(
    SuiteCoreComponentId,
    SuiteCoreStringKey.Common_SiteTemplate,
    constants ? { Site: constants.Site } : undefined
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

  // Split menus into those that belong to a configured category vs. those
  // that should render inline in the AppBar (default, backwards-compatible
  // behaviour). The user menu is always inline.
  const { inlineMenus, menusByCategory, orderedCategories } = useMemo(() => {
    const hasCategories = !!categories && categories.length > 0;
    const categoryIds = new Set(
      hasCategories ? (categories as ICategoryConfig[]).map((c) => c.id) : []
    );
    const byCategory = new Map<string, IMenuConfig[]>();
    const inline: typeof allMenus = [];

    for (const menu of allMenus) {
      const cat = (menu as IMenuConfig).category;
      if (!menu.isUserMenu && hasCategories && cat && categoryIds.has(cat)) {
        const list = byCategory.get(cat) ?? [];
        list.push(menu as IMenuConfig);
        byCategory.set(cat, list);
      } else {
        inline.push(menu);
      }
    }

    const ordered = hasCategories
      ? [...(categories as ICategoryConfig[])].sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
        )
      : [];

    return {
      inlineMenus: inline,
      menusByCategory: byCategory,
      orderedCategories: ordered,
    };
  }, [allMenus, categories]);

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
            width: 'auto',
            marginRight: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {Logo}
        </Box>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {(showTitle !== false) ? siteTitle : '\u00A0' }
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
              {inlineMenus.map((menu, index) =>
                menu.isUserMenu ? (
                  <UserMenu key={`user-menu`} />
                ) : (
                  <DropdownMenu
                    key={`menu-${index}`}
                    menuType={menu.menuType}
                    menuIcon={menu.menuIcon as ReactElement}
                    action={menu.action}
                    hideWhenEmpty={menu.hideWhenEmpty}
                  />
                )
              )}
              {orderedCategories.map((category) => (
                <CategoryMenu
                  key={`category-${category.id}`}
                  category={category}
                  menus={menusByCategory.get(category.id) ?? []}
                />
              ))}
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
          {isAuthenticated && actions}
          <UserLanguageSelector />
        </Box>
      </Toolbar>
      <SideMenu isOpen={isSideMenuOpen} onClose={handleCloseSideMenu} />
    </AppBar>
  );
};

export default TopMenu;
