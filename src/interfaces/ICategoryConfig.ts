import { ReactElement, ReactNode } from 'react';

/**
 * Configuration for a TopMenu category (mega-menu container).
 *
 * Categories let you group multiple icon dropdowns under a single AppBar
 * button. Menus opt into a category by setting `IMenuConfig.category` (or
 * `AdditionalDropdownMenu.category`) to this category's `id`. The TopMenu
 * renders one icon button per category that has at least one matching menu;
 * clicking it opens a popover containing the matching menus as icon tiles.
 *
 * Backwards compatibility: if `TopMenu` is not given a `categories` array,
 * or if a menu does not declare a `category`, it renders inline in the AppBar
 * exactly as before.
 */
export interface ICategoryConfig {
  /** Unique identifier referenced by `IMenuConfig.category`. */
  id: string;
  /** Icon shown on the AppBar trigger button. */
  icon: ReactElement;
  /**
   * Optional accessible label / tooltip / panel header. Plain string for
   * tooltip; render-prop or node for the panel header if `showHeader` is true.
   */
  label?: string;
  /** Optional header content shown above the tile grid when `showHeader` is true. */
  header?: ReactNode;
  /** Show the `header` (or `label`) above the tile grid. Defaults to false. */
  showHeader?: boolean;
  /** Show the menu label under each tile inside the popover. Defaults to true. */
  showLabels?: boolean;
  /**
   * Sort order for placement in the AppBar. Higher numbers render first
   * (same convention as `IMenuConfig.priority`). Defaults to 0.
   */
  priority?: number;
  /** Number of tile columns in the popover grid. Defaults to 3. */
  columns?: number;
  /** Hide the category trigger when it has no matching menus. Defaults to true. */
  hideWhenEmpty?: boolean;
}
