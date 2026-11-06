// src/app/menuContext.tsx
import {
  IRoleDTO,
  SuiteCoreComponentId,
  SuiteCoreStringKey,
  SuiteCoreStringKeyValue,
} from '@digitaldefiance/suite-core-lib';
import {
  AccountCircle,
  Autorenew as AutorenewIcon,
  Brightness4,
  Brightness7,
  Dashboard as DashboardIcon,
  Key as KeyIcon,
  LockOpen as LockOpenIcon,
  LockReset as LockResetIcon,
  Login as LoginIcon,
  ExitToApp as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Settings,
} from '@mui/icons-material';
import {
  FC,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IMenuConfig } from '../interfaces/IMenuConfig';
import { IMenuOption } from '../interfaces/IMenuOption';
import { MenuType, MenuTypes } from '../types/MenuType';
import { useAuth } from './auth-context';
import { useI18n } from './I18nProvider';
import { useSuiteConfig } from './SuiteConfigProvider';
import { useTheme } from './ThemeProvider';

interface MenuProviderProps {
  children: ReactNode;
  menuConfigs?: IMenuConfig[];
  enableBackupCodes?: boolean;
  /**
   * IDs of menu options to suppress from every menu. Matches both the built-in
   * options (e.g. 'change-password', 'user-settings', 'logout') and any option
   * registered via `menuConfigs`. Dividers left orphaned by the removal are
   * cleaned up automatically. Defaults to none hidden, so existing consumers are
   * unaffected.
   */
  hiddenMenuIds?: readonly string[];
}

interface MenuContextType {
  menuOptions: IMenuOption[];
  getMenuOptions: (
    menuType: MenuType,
    includeDividers: boolean
  ) => IMenuOption[];
  registerMenuOption: (option: IMenuOption) => () => void;
  registerMenuOptions: (options: IMenuOption[]) => () => void;
  getTopMenus: () => Array<IMenuConfig>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: FC<MenuProviderProps> = ({
  children,
  menuConfigs = [],
  enableBackupCodes = true,
  hiddenMenuIds = [],
}) => {
  const {
    userData: user,
    isAuthenticated,
    admin: isGlobalAdmin,
    mnemonic,
    clearMnemonic,
    wallet,
    clearWallet,
  } = useAuth();
  const { mode: colorMode, toggleColorMode: themeToggle } = useTheme();
  const registeredMenuOptions = useRef(new Set<() => void>());
  const [registeredOptions, setRegisteredOptions] = useState<
    Map<string, IMenuOption>
  >(new Map<string, IMenuOption>());
  const { tComponent } = useI18n();
  const { baseUrl } = useSuiteConfig();
  // Flip the theme immediately with the crypto-free ThemeProvider toggle, then persist the choice to the server as a
  // best-effort side effect. The persistence path (which pulls ecies-lib + axios) is loaded lazily via dynamic import
  // ONLY when an authenticated user toggles, so it stays out of the static bundle for consumers that only use the menu.
  const toggleColorMode = useCallback(() => {
    const next = colorMode === 'dark' ? 'light' : 'dark';
    themeToggle();
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const [{ createAuthenticatedApiClient }, { dehydrateUserSettings }] = await Promise.all([
          import('../services/index.js'),
          import('@digitaldefiance/suite-core-lib'),
        ]);
        const api = createAuthenticatedApiClient(baseUrl);
        await api.post('/user/settings', dehydrateUserSettings({ darkMode: next === 'dark' } as never));
      } catch {
        // Best-effort: the theme already flipped; a failed persist just means it is not remembered server-side.
      }
    })();
  }, [colorMode, themeToggle, isAuthenticated, baseUrl]);

  const registerMenuOption = useCallback((option: IMenuOption) => {
    const unregister = () => {
      setRegisteredOptions((prev) => {
        const newMap = new Map(prev);
        newMap.delete(option.id);
        return newMap;
      });
      registeredMenuOptions.current.delete(unregister);
    };

    setRegisteredOptions((prev) => {
      const newMap = new Map(prev);
      newMap.set(option.id, option);
      return newMap;
    });
    registeredMenuOptions.current.add(unregister);

    return unregister;
  }, []);

  const registerMenuOptions = useCallback(
    (options: IMenuOption[]) => {
      const unregisterFunctions = options.map(registerMenuOption);
      return () => unregisterFunctions.forEach((f) => f());
    },
    [registerMenuOption]
  );

  const menuOptions = useMemo(() => {
    const isUserRestricted = () => {
      return user?.roles?.some((role: IRoleDTO) => role.child) ?? false;
    };
    let index = 0;
    const baseOptions: IMenuOption[] = [
      {
        id: 'dashboard',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Common_Dashboard
        ),
        icon: <DashboardIcon />,
        link: '/dashboard',
        requiresAuth: true,
        includeOnMenus: [MenuTypes.SideMenu],
        index: index++,
      },
      {
        id: 'user-divider',
        label: '',
        divider: true,
        includeOnMenus: [MenuTypes.SideMenu],
        index: index++,
        requiresAuth: false,
      },
      {
        id: 'logout',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.LogoutButton
        ),
        icon: <LogoutIcon />,
        link: '/logout',
        requiresAuth: true,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
      },
      {
        id: 'login',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Login_LoginButton
        ),
        icon: <LoginIcon />,
        link: '/login',
        requiresAuth: false,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
      },
      {
        id: 'register',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.RegisterButton
        ),
        icon: <PersonAddIcon />,
        link: '/register',
        requiresAuth: false,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
      },
      {
        id: 'forgot-password',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.ForgotPassword_Title
        ),
        icon: <LockOpenIcon />,
        link: '/forgot-password',
        requiresAuth: false,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
      },
      {
        id: 'change-password',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Common_ChangePassword
        ),
        icon: <LockResetIcon />,
        link: '/change-password',
        requiresAuth: true,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
      },
      ...(enableBackupCodes
        ? [
            {
              id: 'backup-code',
              label: tComponent<SuiteCoreStringKeyValue>(
                SuiteCoreComponentId,
                SuiteCoreStringKey.BackupCodeRecovery_Title
              ),
              icon: <KeyIcon />,
              link: '/backup-code',
              requiresAuth: false,
              includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
              index: index++,
            },
            {
              id: 'backup-codes',
              label: tComponent<SuiteCoreStringKeyValue>(
                SuiteCoreComponentId,
                SuiteCoreStringKey.BackupCodeRecovery_GenerateNewCodes
              ),
              icon: <AutorenewIcon />,
              link: '/backup-codes',
              requiresAuth: true,
              includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
              index: index++,
            },
          ]
        : []),
      {
        id: 'divider',
        label: '',
        divider: true,
        includeOnMenus: [MenuTypes.SideMenu],
        index: index++,
        requiresAuth: false,
      },
      {
        id: 'clear-mnemonic',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Common_ClearMnemonic
        ),
        action: clearMnemonic,
        icon: <KeyIcon />,
        requiresAuth: true,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
        filter: () => !!mnemonic,
      },
      {
        id: 'clear-wallet',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Common_ClearWallet
        ),
        action: clearWallet,
        icon: <KeyIcon />,
        requiresAuth: true,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
        filter: () => !!wallet,
      },
      ...(isUserRestricted() ? [] : []),
      {
        id: 'color-divider',
        label: '',
        divider: true,
        includeOnMenus: [MenuTypes.SideMenu],
        index: index++,
        requiresAuth: undefined,
      },
      {
        id: 'theme-toggle',
        label:
          colorMode === 'dark'
            ? tComponent<SuiteCoreStringKeyValue>(
                SuiteCoreComponentId,
                SuiteCoreStringKey.Common_ThemeToggle_Light
              )
            : tComponent<SuiteCoreStringKeyValue>(
                SuiteCoreComponentId,
                SuiteCoreStringKey.Common_ThemeToggle_Dark
              ),
        icon: colorMode === 'dark' ? <Brightness7 /> : <Brightness4 />,
        includeOnMenus: [MenuTypes.SideMenu],
        index: index++,
        requiresAuth: undefined,
        action: toggleColorMode,
      },
      {
        id: 'user-settings',
        label: tComponent<SuiteCoreStringKeyValue>(
          SuiteCoreComponentId,
          SuiteCoreStringKey.Settings_Title
        ),
        icon: <Settings />,
        link: '/user-settings',
        requiresAuth: true,
        includeOnMenus: [MenuTypes.UserMenu, MenuTypes.SideMenu],
        index: index++,
      },
    ];

    const allOptions = [...baseOptions, ...registeredOptions.values()];
    return allOptions.sort((a, b) => a.index - b.index);
  }, [
    tComponent,
    registeredOptions,
    user?.roles,
    colorMode,
    toggleColorMode,
    clearMnemonic,
    clearWallet,
    mnemonic,
    wallet,
    enableBackupCodes,
  ]);

  const getMenuOptions = useCallback(
    (menuType: MenuType, includeDividers: boolean) => {
      const hidden = new Set(hiddenMenuIds);
      const MenuFilter = (o: IMenuOption) => {
        // Suppress any option whose id the consumer asked to hide.
        if (hidden.has(o.id)) return false;

        // Apply the custom filter first
        let customFilterPasses = true;
        if (o.filter !== undefined) {
          customFilterPasses = o.filter(o);
        }
        if (!customFilterPasses) return false;

        if (o.divider === true && !includeDividers) return false;

        if (o.requiresAdmin === true && !isGlobalAdmin) return false;

        return (
          o.includeOnMenus.includes(menuType) &&
          (o.requiresAuth === undefined || o.requiresAuth === isAuthenticated)
        );
      };

      const filtered = menuOptions.filter(MenuFilter);

      // Drop dividers left orphaned once hidden items are removed: a divider at
      // the start or end of the list, or immediately following another divider,
      // carries no meaning and would show as a stray separator.
      return filtered.filter((o, i) => {
        if (o.divider !== true) return true;
        const prev = filtered[i - 1];
        if (prev === undefined || prev.divider === true) return false;
        if (i === filtered.length - 1) return false;
        return true;
      });
    },
    [hiddenMenuIds, isAuthenticated, isGlobalAdmin, menuOptions]
  );

  useEffect(() => {
    if (menuConfigs.length > 0) {
      return registerMenuOptions(
        menuConfigs.flatMap((config) => config.options)
      );
    }
    return undefined;
  }, [menuConfigs, registerMenuOptions]);

  const getTopMenus = useCallback(() => {
    const menus: Array<IMenuConfig & { isUserMenu?: boolean }> = [
      ...menuConfigs.map((config) => ({ ...config, isUserMenu: false })),
      {
        menuType: MenuTypes.UserMenu,
        menuIcon: <AccountCircle />,
        priority: 0,
        options: [],
        isUserMenu: true,
      },
    ];
    return menus.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }, [menuConfigs]);

  const contextValue = useMemo(() => {
    return {
      menuOptions: menuOptions,
      getMenuOptions: getMenuOptions,
      registerMenuOption: registerMenuOption,
      registerMenuOptions: registerMenuOptions,
      getTopMenus: getTopMenus,
    };
  }, [
    menuOptions,
    getMenuOptions,
    registerMenuOption,
    registerMenuOptions,
    getTopMenus,
  ]);

  const memoizedChildren = useMemo(() => children, [children]);
  return (
    <MenuContext.Provider value={contextValue}>
      {memoizedChildren}
    </MenuContext.Provider>
  );
};

export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};
