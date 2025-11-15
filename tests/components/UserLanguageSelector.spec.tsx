import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserLanguageSelector } from '../../src/components/UserLanguageSelector';
import { AuthContext, I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockSetLanguage = jest.fn();

const mockAuthContext = {
  language: 'en-US',
  setLanguage: mockSetLanguage,
  isAuthenticated: false,
  isCheckingAuth: false,
} as any;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const engine = I18nEngine.getInstance('default');
  return (
    <I18nProvider i18nEngine={engine}>
      <AuthContext.Provider value={mockAuthContext}>
        {children}
      </AuthContext.Provider>
    </I18nProvider>
  );
};

describe('UserLanguageSelector', () => {
  beforeEach(() => {
    mockSetLanguage.mockClear();
  });

  it('renders flag button', () => {
    const { container } = render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    expect(container.querySelector('button')).toBeDefined();
  });

  it('opens language menu on click', async () => {
    render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeDefined();
    });
  });

  it('changes language when menu item clicked', async () => {
    render(
      <TestWrapper>
        <UserLanguageSelector />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitem');
      if (menuItems.length > 0) {
        fireEvent.click(menuItems[0]);
        expect(mockSetLanguage).toHaveBeenCalled();
      }
    });
  });
});
