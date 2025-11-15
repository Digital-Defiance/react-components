import { FC } from 'react';
import { AccountCircle } from '@mui/icons-material';
import { MenuTypes } from '../types/MenuType';
import { DropdownMenu } from './DropdownMenu';

export const UserMenu: FC = () => {
  return (
    <DropdownMenu
      menuType={MenuTypes.UserMenu}
      menuIcon={<AccountCircle />}
    />
  );
};

export default UserMenu;
