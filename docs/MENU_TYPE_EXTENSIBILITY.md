# Menu Type Extensibility Guide

## Overview

The menu system now uses an extensible `MenuType` system instead of the rigid `IncludeOnMenu` enum. This allows users to create custom menu types without modifying the library code.

## Basic Usage

### Using Built-in Menu Types

```typescript
import { MenuTypes } from '@digitaldefiance/express-suite-react-components';

// Use built-in menu types
const menuType = MenuTypes.SideMenu;  // or .TopMenu, .UserMenu
```

### Creating Custom Menu Types

```typescript
import { createMenuType, MenuType } from '@digitaldefiance/express-suite-react-components';

// Create your own menu type
const AdminMenu: MenuType = createMenuType('AdminMenu');
const NotificationMenu: MenuType = createMenuType('NotificationMenu');
```

## Example: Adding a Custom Admin Menu

```typescript
import { createMenuType, MenuTypes, AdditionalDropdownMenu } from '@digitaldefiance/express-suite-react-components';
import { AdminPanelSettings } from '@mui/icons-material';

// 1. Create custom menu type
export const CustomMenuTypes = {
  AdminMenu: createMenuType('AdminMenu'),
} as const;

// 2. Register menu options with your custom type
const adminMenuOptions: IMenuOption[] = [
  {
    id: 'admin-dashboard',
    label: 'Admin Dashboard',
    icon: <AdminPanelSettings />,
    link: '/admin',
    requiresAuth: true,
    includeOnMenus: [CustomMenuTypes.AdminMenu, MenuTypes.SideMenu],
    index: 100,
  },
];

// 3. Use in your app
function MyApp() {
  const { registerMenuOptions } = useMenu();
  
  useEffect(() => {
    return registerMenuOptions(adminMenuOptions);
  }, []);

  const additionalMenus: AdditionalDropdownMenu[] = [
    {
      menuType: CustomMenuTypes.AdminMenu,
      menuIcon: <AdminPanelSettings />,
      priority: 10,
    },
  ];

  return <TopMenu Logo={<MyLogo />} additionalMenus={additionalMenus} />;
}
```

## Type Safety

The `MenuType` is a branded string type, providing:
- Type safety at compile time
- Runtime flexibility
- No enum limitations
- Full extensibility

```typescript
// This is type-safe
const myMenu: MenuType = createMenuType('MyMenu');

// This won't compile (good!)
const invalid: MenuType = 'just-a-string';  // Error!
```

## Migration from IncludeOnMenu Enum

Old code:
```typescript
import { IncludeOnMenu } from '@digitaldefiance/express-suite-react-components';

includeOnMenus: [IncludeOnMenu.SideMenu, IncludeOnMenu.UserMenu]
```

New code:
```typescript
import { MenuTypes } from '@digitaldefiance/express-suite-react-components';

includeOnMenus: [MenuTypes.SideMenu, MenuTypes.UserMenu]
```

## Best Practices

1. **Create a constants file** for your custom menu types:
```typescript
// src/constants/menuTypes.ts
import { createMenuType } from '@digitaldefiance/express-suite-react-components';

export const AppMenuTypes = {
  AdminMenu: createMenuType('AdminMenu'),
  NotificationMenu: createMenuType('NotificationMenu'),
  SettingsMenu: createMenuType('SettingsMenu'),
} as const;
```

2. **Use descriptive names** that clearly indicate the menu's purpose

3. **Document your custom menu types** for other developers

4. **Combine with built-in types** when menu items should appear in multiple places
