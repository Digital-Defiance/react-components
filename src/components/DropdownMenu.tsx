import { Box, Fade, IconButton, Menu, MenuItem } from '@mui/material';
import { FC, MouseEvent, ReactElement, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuType } from '../types/MenuType';
import { IMenuOption } from '../interfaces/IMenuOption';
import { useMenu } from '../contexts/MenuContext';

interface DropdownMenuProps {
  menuType: MenuType;
  menuIcon: ReactElement;
  /** When true, the entire icon button is hidden if there are no menu options. Defaults to false. */
  hideWhenEmpty?: boolean;
  /** Optional callback invoked when the icon button is clicked. When provided alongside menu options, the action fires first and the dropdown still opens. When there are no menu options, only the action fires. */
  action?: () => void;
}

export const DropdownMenu: FC<DropdownMenuProps> = ({ menuType, menuIcon, hideWhenEmpty = false, action }) => {
  const { getMenuOptions } = useMenu();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);
  const handleMenuItemClick = useCallback(
    (option: IMenuOption) => (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (option.action) {
        option.action();
      } else if (option.link !== undefined) {
        if (
          typeof option.link === 'object' &&
          'pathname' in option.link &&
          'state' in option.link
        ) {
          navigate(option.link.pathname, { state: option.link.state });
        } else {
          navigate(option.link);
        }
      }
      handleClose(); // Call handleClose after handling the click
    },
    [navigate, handleClose], // Add handleClose to the dependency array
  );

  const menuItems = getMenuOptions(menuType, false);
  const hasItems = menuItems.length > 0;

  const handleClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (action) {
      action();
    }
    if (hasItems) {
      setAnchorEl(event.currentTarget);
    }
  }, [action, hasItems]);

  if (!hasItems && hideWhenEmpty) {
    return null;
  }

  return (
    <Box>
      <IconButton color="inherit" onClick={(hasItems || action) ? handleClick : undefined}>
        {menuIcon}
      </IconButton>
      {hasItems && (
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
          {menuItems.map((option) => (
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
                ...option.additionalSx
              }}
            >
              {option.icon}
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  );
};

export default DropdownMenu;