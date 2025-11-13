import { Drawer, List } from '@mui/material';
import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  const menuOptions = getMenuOptions(IncludeOnMenu.SideMenu, true);

  const handleNavigate = (link: string | { pathname: string; state?: any }) => {
    if (typeof link === 'string') {
      navigate(link);
    } else {
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
