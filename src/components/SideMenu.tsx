import { Drawer, List } from '@mui/material';
import { FC } from 'react';
import { IMenuOption } from '../interfaces';
import { SideMenuListItem } from './SideMenuListItem';

export interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuOptions: IMenuOption[];
  onNavigate?: (link: string | { pathname: string; state?: any }) => void;
}

export const SideMenu: FC<SideMenuProps> = ({ isOpen, onClose, menuOptions, onNavigate }) => {
  return (
    <Drawer anchor="left" open={isOpen} onClose={onClose}>
      <List>
        {menuOptions.map((item: IMenuOption) => (
          <SideMenuListItem key={item.id} menuItem={item} onClose={onClose} onNavigate={onNavigate} />
        ))}
      </List>
    </Drawer>
  );
};
