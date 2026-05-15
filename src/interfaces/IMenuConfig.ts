import { ReactElement } from 'react';
import { IMenuOption } from './IMenuOption';
import { createMenuType } from '../types';

export interface IMenuConfig {
  menuType: ReturnType<typeof createMenuType>;
  menuIcon: ReactElement;
  priority?: number;
  options: IMenuOption[];
  isUserMenu?: boolean;
  /** Optional callback invoked when the icon button is clicked. */
  action?: () => void;
  /** When true, the menu icon is hidden if there are no sub-options. Defaults to false. */
  hideWhenEmpty?: boolean;
  /**
   * Optional category identifier. When the TopMenu is configured with matching
   * `categories`, this menu is rendered as a tile inside that category's
   * mega-menu popover instead of inline in the AppBar. When omitted (or no
   * matching category exists), the menu renders inline as a normal dropdown.
   */
  category?: string;
  /**
   * Optional human-readable label. When the menu is rendered as a tile inside
   * a category popover with `showLabels` enabled, this is shown under the icon.
   * Also used as the IconButton tooltip. Falls back to `menuType` when omitted.
   */
  label?: string;
}
