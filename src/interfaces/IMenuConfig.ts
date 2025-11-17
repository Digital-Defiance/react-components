import { ReactElement } from 'react';
import { IMenuOption } from './IMenuOption';
import { createMenuType } from '../types';

export interface IMenuConfig {
  menuType: ReturnType<typeof createMenuType>;
  menuIcon: ReactElement;
  priority?: number;
  options: IMenuOption[];
  isUserMenu?: boolean;
}