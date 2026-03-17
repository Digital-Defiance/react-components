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
}