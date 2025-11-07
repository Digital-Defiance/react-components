import { Brightness4, Brightness7 } from '@mui/icons-material';
import {
  IconButton,
  ThemeProvider as MuiThemeProvider,
  PaletteMode,
  createTheme,
  Theme,
} from '@mui/material';
import { FC, ReactNode, createContext, useContext, useMemo, useState } from 'react';

export interface ThemeContextType {
  toggleColorMode: () => void;
  mode: PaletteMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
};

export interface AppThemeProviderProps {
  children: ReactNode;
  customTheme?: (mode: PaletteMode) => Theme;
}

export const AppThemeProvider: FC<AppThemeProviderProps> = ({ children, customTheme }) => {
  const [mode, setMode] = useState<PaletteMode>('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () => (customTheme ? customTheme(mode) : createTheme({ palette: { mode } })),
    [mode, customTheme]
  );

  return (
    <ThemeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const ThemeToggleButton: FC = () => {
  const { mode, toggleColorMode } = useTheme();
  return (
    <IconButton onClick={toggleColorMode} color="inherit">
      {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};
