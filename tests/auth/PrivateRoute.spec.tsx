import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PrivateRoute } from '../../src/auth/PrivateRoute';

describe('PrivateRoute', () => {
  it('should render children when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <PrivateRoute isAuthenticated={true} isCheckingAuth={false}>
              <div>Protected Content</div>
            </PrivateRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeDefined();
  });

  it('should show loading when checking auth', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <PrivateRoute isAuthenticated={false} isCheckingAuth={true}>
              <div>Protected Content</div>
            </PrivateRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Checking authentication...')).toBeDefined();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('should redirect when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <PrivateRoute isAuthenticated={false} isCheckingAuth={false}>
              <div>Protected Content</div>
            </PrivateRoute>
          } />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('should use custom loading component', () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={
            <PrivateRoute 
              isAuthenticated={false} 
              isCheckingAuth={true}
              loadingComponent={<div>Custom Loading</div>}
            >
              <div>Protected Content</div>
            </PrivateRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Loading')).toBeDefined();
  });
});
