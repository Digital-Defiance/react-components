import { I18nEngine } from '@digitaldefiance/i18n-lib';
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from '../../src/auth/PrivateRoute';
import { I18nProvider } from '../../src/contexts';
import { AuthContext } from '../../src/contexts/AuthProvider';

const mockAuthContext = (isAuthenticated: boolean, isCheckingAuth: boolean) =>
  ({
    isAuthenticated,
    isCheckingAuth,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

describe('PrivateRoute', () => {
  it('should render children when authenticated', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(true, false)}>
          <MemoryRouter
            initialEntries={['/protected']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <div>Protected Content</div>
                  </PrivateRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });

  it('should show loading when checking auth', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(false, true)}>
          <MemoryRouter
            initialEntries={['/protected']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <div>Protected Content</div>
                  </PrivateRoute>
                }
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('should redirect when not authenticated', () => {
    const engine = I18nEngine.getInstance('default');
    render(
      <I18nProvider i18nEngine={engine}>
        <AuthContext.Provider value={mockAuthContext(false, false)}>
          <MemoryRouter
            initialEntries={['/protected']}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <Routes>
              <Route
                path="/protected"
                element={
                  <PrivateRoute>
                    <div>Protected Content</div>
                  </PrivateRoute>
                }
              />
              <Route path="/login" element={<div>Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
  });
});
