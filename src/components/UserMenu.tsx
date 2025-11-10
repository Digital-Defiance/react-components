import { FC } from 'react';
import { AccountCircle } from '@mui/icons-material';
import { IncludeOnMenu } from '../enumerations/IncludeOnMenu';
import { DropdownMenu } from './DropdownMenu';

export const UserMenu: FC = () => {
  return (
    <DropdownMenu
      menuType={IncludeOnMenu.UserMenu}
      menuIcon={<AccountCircle />}
    />
  );
};

export default UserMenu;
