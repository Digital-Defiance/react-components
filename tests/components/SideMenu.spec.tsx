import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SideMenu } from '../../src/components/SideMenu';
import { MenuProvider, AuthContext, I18nProvider, AppThemeProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

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
});
