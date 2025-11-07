import { Box, Fade, IconButton, Menu, MenuItem } from '@mui/material';
import { FC, MouseEvent, ReactElement, useCallback, useState } from 'react';

export interface MenuOption {
  id: string;
  label: string;
  icon?: ReactElement;
  action?: () => void;
  link?: string;
}

export interface DropdownMenuProps {
  menuIcon: ReactElement;
  options: MenuOption[];
  onNavigate?: (link: string) => void;
}

export const DropdownMenu: FC<DropdownMenuProps> = ({ menuIcon, options, onNavigate }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (option: MenuOption) => (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (option.action) {
        option.action();
      } else if (option.link && onNavigate) {
        onNavigate(option.link);
      }
      handleClose();
    },
    [onNavigate, handleClose]
  );

  const handleClick = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  if (options.length === 0) {
    return null;
  }

  return (
    <Box>
      <IconButton color="inherit" onClick={handleClick}>
        {menuIcon}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        TransitionComponent={Fade}
        sx={{
          '& .MuiPopover-paper': {
            opacity: 0.5,
            overflow: 'visible',
          },
        }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.id}
            component="li"
            onClick={handleMenuItemClick(option)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              '& > svg': {
                marginRight: 2,
                width: 24,
                height: 24,
              },
            }}
          >
            {option.icon}
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
