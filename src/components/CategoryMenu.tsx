import {
  Box,
  Fade,
  IconButton,
  Popover,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  FC,
  MouseEvent,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { ICategoryConfig } from '../interfaces/ICategoryConfig';
import { IMenuConfig } from '../interfaces/IMenuConfig';
import { DropdownMenu } from './DropdownMenu';

export interface CategoryMenuProps {
  category: ICategoryConfig;
  menus: IMenuConfig[];
}

/**
 * Renders an AppBar icon button that opens a popover containing a grid of
 * icon tiles. Each tile is a {@link DropdownMenu} for one of the supplied
 * `menus`, preserving its existing sub-menu behaviour. Use this together with
 * `IMenuConfig.category` to collapse many top-bar icons into a small number
 * of category containers (a "mega-menu" pattern).
 */
export const CategoryMenu: FC<CategoryMenuProps> = ({ category, menus }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const columns = category.columns ?? 3;
  const showLabels = category.showLabels ?? true;
  const showHeader = category.showHeader ?? false;
  const hideWhenEmpty = category.hideWhenEmpty ?? true;

  const visibleMenus = useMemo(
    () => menus.filter((m) => !m.isUserMenu),
    [menus]
  );

  if (visibleMenus.length === 0 && hideWhenEmpty) {
    return null;
  }

  const trigger = (
    <IconButton
      color="inherit"
      onClick={handleOpen}
      aria-label={category.label ?? category.id}
      aria-haspopup="true"
      aria-expanded={Boolean(anchorEl) || undefined}
    >
      {category.icon}
    </IconButton>
  );

  return (
    <Box>
      {category.label ? (
        <Tooltip title={category.label}>{trigger}</Tooltip>
      ) : (
        trigger
      )}
      <Popover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Box sx={{ p: 1.5, minWidth: 64 * columns + 24 }}>
          {showHeader && (category.header || category.label) && (
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                px: 1,
                pb: 1,
                color: 'text.secondary',
                lineHeight: 1.2,
              }}
            >
              {category.header ?? category.label}
            </Typography>
          )}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(72px, 1fr))`,
              gap: 1,
            }}
          >
            {visibleMenus.map((menu, index) => {
              const tileLabel = menu.label ?? String(menu.menuType);
              return (
                <Box
                  key={`${category.id}-tile-${menu.menuType}-${index}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    px: 0.5,
                    py: 0.5,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <DropdownMenu
                    menuType={menu.menuType}
                    menuIcon={menu.menuIcon as ReactElement}
                    action={menu.action}
                    hideWhenEmpty={menu.hideWhenEmpty}
                  />
                  {showLabels && (
                    <Typography
                      variant="caption"
                      sx={{
                        mt: -0.5,
                        textAlign: 'center',
                        lineHeight: 1.1,
                        color: 'text.primary',
                        userSelect: 'none',
                      }}
                    >
                      {tileLabel}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default CategoryMenu;
