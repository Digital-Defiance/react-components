import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material';
import { SideMenu } from '../../src/components/SideMenu';
import { MenuProvider, AuthContext, I18nProvider, AppThemeProvider, SuiteConfigProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

// Mock the auth and API services
jest.mock('../../src/services/authenticatedApi', () => ({
  createAuthenticatedApiClient: jest.fn(() => ({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} }),
  })),
}));

jest.mock('../../src/services/authService', () => ({
  createAuthService: jest.fn(() => ({
    verifyToken: jest.fn().mockResolvedValue({ valid: false, userData: null }),
    refreshToken: jest.fn().mockResolvedValue({ token: null }),
  })),
}));

const mockAuthContext = (isAuthenticated: boolean) => ({
  isAuthenticated,
  isCheckingAuth: false,
  userData: null,
  mnemonic: null,
  wallet: null,
  language: 'en-US',
  setLanguage: jest.fn(),
  clearMnemonic: jest.fn(),
  clearWallet: jest.fn(),
} as any);

const TestWrapper: React.FC<{ isAuthenticated: boolean; children: React.ReactNode }> = ({ 
  isAuthenticated, 
  children 
}) => {
  const engine = I18nEngine.getInstance('default');
  return (
    <SuiteConfigProvider baseUrl="http://localhost:3000">
      <I18nProvider i18nEngine={engine}>
        <AppThemeProvider>
          <AuthContext.Provider value={mockAuthContext(isAuthenticated)}>
            <MenuProvider>
              <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                {children}
              </MemoryRouter>
            </MenuProvider>
          </AuthContext.Provider>
        </AppThemeProvider>
      </I18nProvider>
    </SuiteConfigProvider>
  );
};

describe('SideMenu', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('renders drawer when open', () => {
    const { container } = render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(container.querySelector('.MuiDrawer-root')).toBeDefined();
  });

  it('renders menu items when authenticated', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeDefined();
  });

  it('does not show authenticated items when not authenticated', () => {
    render(
      <TestWrapper isAuthenticated={false}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByText(/dashboard/i)).toBeNull();
  });

  it('renders theme toggle menu item', () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Verify the theme toggle menu item is present
    // When in light mode, it should say "Set Dark Mode"
    const themeToggleItem = screen.getByText(/dark mode/i);
    expect(themeToggleItem).toBeDefined();
  });

  it('calls onClose when theme toggle is clicked', async () => {
    render(
      <TestWrapper isAuthenticated={true}>
        <SideMenu isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const themeToggleItem = screen.getByText(/dark mode/i);
    fireEvent.click(themeToggleItem);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Theme Toggle Integration', () => {
    it('toggles dark mode when clicked while authenticated', async () => {
      // Create a component that can access the theme
      const ThemeChecker = () => {
        const theme = useMuiTheme();
        return <div data-testid="theme-mode">{theme.palette.mode}</div>;
      };

      const { rerender } = render(
        <TestWrapper isAuthenticated={true}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Initial state should be light mode
      expect(screen.getByTestId('theme-mode').textContent).toBe('light');
      expect(screen.getByText(/dark mode/i)).toBeDefined();

      // Click the dark mode toggle
      const darkModeToggle = screen.getByText(/dark mode/i);
      fireEvent.click(darkModeToggle);

      // Wait for theme to change
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
      }, { timeout: 1000 });

      // Reopen the menu and verify the toggle text changed
      rerender(
        <TestWrapper isAuthenticated={true}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Should now show "light mode" option since we're in dark mode
      await waitFor(() => {
        expect(screen.getByText(/light mode/i)).toBeDefined();
      });

      // Click again to toggle back
      const lightModeToggle = screen.getByText(/light mode/i);
      fireEvent.click(lightModeToggle);

      // Wait for theme to change back
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('light');
      }, { timeout: 1000 });
    });

    it('toggles dark mode when clicked while NOT authenticated', async () => {
      // Create a component that can access the theme
      const ThemeChecker = () => {
        const theme = useMuiTheme();
        return <div data-testid="theme-mode">{theme.palette.mode}</div>;
      };

      const { rerender } = render(
        <TestWrapper isAuthenticated={false}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Initial state should be light mode
      expect(screen.getByTestId('theme-mode').textContent).toBe('light');
      expect(screen.getByText(/dark mode/i)).toBeDefined();

      // Click the dark mode toggle
      const darkModeToggle = screen.getByText(/dark mode/i);
      fireEvent.click(darkModeToggle);

      // Wait for theme to change (should work even when not authenticated)
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
      }, { timeout: 1000 });

      // Reopen the menu and verify the toggle text changed
      rerender(
        <TestWrapper isAuthenticated={false}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Should now show "light mode" option since we're in dark mode
      await waitFor(() => {
        expect(screen.getByText(/light mode/i)).toBeDefined();
      });

      // Click again to toggle back
      const lightModeToggle = screen.getByText(/light mode/i);
      fireEvent.click(lightModeToggle);

      // Wait for theme to change back
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('light');
      }, { timeout: 1000 });
    });

    it('maintains theme state across multiple toggles', async () => {
      const ThemeChecker = () => {
        const theme = useMuiTheme();
        return <div data-testid="theme-mode">{theme.palette.mode}</div>;
      };

      const { rerender } = render(
        <TestWrapper isAuthenticated={false}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Start in light mode
      expect(screen.getByTestId('theme-mode').textContent).toBe('light');

      // Toggle to dark
      fireEvent.click(screen.getByText(/dark mode/i));
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
      });

      // Reopen menu
      rerender(
        <TestWrapper isAuthenticated={false}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Toggle to light
      await waitFor(() => {
        fireEvent.click(screen.getByText(/light mode/i));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('light');
      });

      // Reopen menu
      rerender(
        <TestWrapper isAuthenticated={false}>
          <ThemeChecker />
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      // Toggle to dark again
      await waitFor(() => {
        fireEvent.click(screen.getByText(/dark mode/i));
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
      });
    });

    it('closes menu after theme toggle', async () => {
      render(
        <TestWrapper isAuthenticated={false}>
          <SideMenu isOpen={true} onClose={mockOnClose} />
        </TestWrapper>
      );

      const darkModeToggle = screen.getByText(/dark mode/i);
      fireEvent.click(darkModeToggle);

      // Menu should close after action
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
