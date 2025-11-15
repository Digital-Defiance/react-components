import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UnAuthRoute } from '../../src/auth/UnAuthRoute';
import { AuthContext } from '../../src/contexts/AuthProvider';
import { I18nProvider } from '../../src/contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

const mockAuthContext = (isAuthenticated: boolean, isCheckingAuth: boolean) => ({
  isAuthenticated,
  isCheckingAuth,
} as any);



describe('UnAuthRoute', () => {
  it('should render children when not authenticated', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(false, false)}>
          <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={
                <UnAuthRoute>
                  <div>Login Form</div>
                </UnAuthRoute>
              } />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.getByText('Login Form')).toBeDefined();
  });

  it('should show loading when checking auth', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(false, true)}>
          <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={
                <UnAuthRoute>
                  <div>Login Form</div>
                </UnAuthRoute>
              } />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.queryByText('Login Form')).toBeNull();
  });

  it('should redirect when authenticated', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(true, false)}>
          <MemoryRouter initialEntries={['/login']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={
                <UnAuthRoute>
                  <div>Login Form</div>
                </UnAuthRoute>
              } />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.queryByText('Login Form')).toBeNull();
  });
});
