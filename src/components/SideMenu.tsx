import { Drawer, List } from '@mui/material';
import { FC } from 'react';
import { IncludeOnMenu } from '../enumerations/IncludeOnMenu';
import { IMenuOption } from '../interfaces/IMenuOption';
import { useMenu } from '../contexts/MenuContext';
import { SideMenuListItem } from './SideMenuListItem';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { getMenuOptions } = useMenu();

  const menuOptions = getMenuOptions(IncludeOnMenu.SideMenu, true);

  return (
    <Drawer anchor="left" open={isOpen} onClose={onClose}>
      <List>
        {menuOptions.map((item: IMenuOption) => (
          <SideMenuListItem key={item.id} menuItem={item} onClose={onClose} />
        ))}
      </List>
    </Drawer>
  );
};

export default SideMenu;
