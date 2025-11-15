// Branded type for menu type identifiers
export type MenuType = string & { readonly __brand: 'MenuType' };

// Factory function to create menu types
export const createMenuType = (id: string): MenuType => id as MenuType;

// Built-in menu types
export const MenuTypes = {
  SideMenu: createMenuType('SideMenu'),
  TopMenu: createMenuType('TopMenu'),
  UserMenu: createMenuType('UserMenu'),
} as const;

// Type for the built-in menu types
export type BuiltInMenuType = typeof MenuTypes[keyof typeof MenuTypes];
