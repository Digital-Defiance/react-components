import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { UnAuthRoute } from '../../src/auth/UnAuthRoute';

describe('UnAuthRoute', () => {
  it('should render children when not authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <UnAuthRoute isAuthenticated={false} isCheckingAuth={false}>
              <div>Login Form</div>
            </UnAuthRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Form')).toBeDefined();
  });

  it('should show loading when checking auth', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <UnAuthRoute isAuthenticated={false} isCheckingAuth={true}>
              <div>Login Form</div>
            </UnAuthRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Checking authentication...')).toBeDefined();
    expect(screen.queryByText('Login Form')).toBeNull();
  });

  it('should redirect when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <UnAuthRoute isAuthenticated={true} isCheckingAuth={false}>
              <div>Login Form</div>
            </UnAuthRoute>
          } />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Login Form')).toBeNull();
  });

  it('should use custom loading component', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={
            <UnAuthRoute 
              isAuthenticated={false} 
              isCheckingAuth={true}
              loadingComponent={<div>Custom Loading</div>}
            >
              <div>Login Form</div>
            </UnAuthRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Custom Loading')).toBeDefined();
  });
});
