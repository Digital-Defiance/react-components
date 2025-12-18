import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UnAuthRoute } from '../../src/auth/UnAuthRoute';
import { I18nProvider } from '../../src/contexts';
import { AuthContext } from '../../src/contexts/AuthProvider';

const mockAuthContext = (isAuthenticated: boolean, isCheckingAuth: boolean) =>
  ({
    isAuthenticated,
    isCheckingAuth,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

describe('UnAuthRoute', () => {
  it('should render children when not authenticated', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(false, false)}>
          <MemoryRouter
            initialEntries={['/login']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <UnAuthRoute>
                    <div>Login Form</div>
                  </UnAuthRoute>
                }
              />
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
          <MemoryRouter
            initialEntries={['/login']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <UnAuthRoute>
                    <div>Login Form</div>
                  </UnAuthRoute>
                }
              />
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
          <MemoryRouter
            initialEntries={['/login']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <UnAuthRoute>
                    <div>Login Form</div>
                  </UnAuthRoute>
                }
              />
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.queryByText('Login Form')).toBeNull();
  });
});
