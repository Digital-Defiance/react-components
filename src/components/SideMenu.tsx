import { Drawer, List } from '@mui/material';
import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMenu } from '../contexts/MenuContext';
import { IMenuOption } from '../interfaces/IMenuOption';
import { MenuTypes } from '../types/MenuType';
import { SideMenuListItem } from './SideMenuListItem';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { getMenuOptions } = useMenu();
  const navigate = useNavigate();

  const menuOptions = getMenuOptions(MenuTypes.SideMenu, true);

  const handleNavigate = (
    link: string | Partial<{ pathname: string; state?: unknown }>
  ) => {
    if (typeof link === 'string') {
      navigate(link);
    } else if (link.pathname) {
      navigate(link.pathname, { state: link.state });
    }
  };

  return (
    <Drawer anchor="left" open={isOpen} onClose={onClose}>
      <List>
        {menuOptions.map((item: IMenuOption) => (
          <SideMenuListItem
            key={item.id}
            menuItem={item}
            onClose={onClose}
            onNavigate={handleNavigate}
          />
        ))}
      </List>
    </Drawer>
  );
};

export default SideMenu;
