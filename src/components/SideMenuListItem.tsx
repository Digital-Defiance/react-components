import { Divider, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { FC, useCallback } from 'react';
import { IMenuOption } from '../interfaces';

export interface SideMenuListItemProps {
  menuItem: IMenuOption;
  onClose: () => void;
  onNavigate?: (link: string | { pathname: string; state?: any }) => void;
}

export const SideMenuListItem: FC<SideMenuListItemProps> = ({
  menuItem,
  onClose,
  onNavigate,
}) => {
  const handleMenuItemClick = useCallback(
    (option: IMenuOption) => (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (option.action) {
        option.action();
      } else if (option.link !== undefined && onNavigate) {
        if (typeof option.link === 'string') {
          onNavigate(option.link);
        } else if (typeof option.link === 'object' && 'pathname' in option.link && option.link.pathname) {
          onNavigate({ pathname: option.link.pathname, state: (option.link as any).state });
        }
      }
      onClose();
    },
    [onNavigate, onClose]
  );

  if (menuItem.divider) {
    return <Divider key={menuItem.label} />;
  } else if (menuItem.link) {
    return (
      <ListItemButton key={menuItem.id} onClick={handleMenuItemClick(menuItem)}>
        {menuItem.icon && <ListItemIcon>{menuItem.icon}</ListItemIcon>}
        <ListItemText primary={menuItem.label} />
      </ListItemButton>
    );
  } else if (menuItem.action) {
    const action = menuItem.action;
    return (
      <ListItemButton
        key={menuItem.id}
        onClick={async () => {
          await action();
          onClose();
        }}
      >
        {menuItem.icon && <ListItemIcon>{menuItem.icon}</ListItemIcon>}
        <ListItemText primary={menuItem.label} />
      </ListItemButton>
    );
  }
  return null;
};
