import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { LogoutPage } from '../../src/components/LogoutPage';

describe('LogoutPage', () => {
  it('calls onLogout on mount', async () => {
    const mockOnLogout = jest.fn().mockResolvedValue(undefined);
    render(<LogoutPage onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  it('calls onNavigate after logout', async () => {
    const mockOnLogout = jest.fn().mockResolvedValue(undefined);
    const mockOnNavigate = jest.fn();
    
    render(<LogoutPage onLogout={mockOnLogout} onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('navigates to custom redirect path', async () => {
    const mockOnLogout = jest.fn().mockResolvedValue(undefined);
    const mockOnNavigate = jest.fn();
    
    render(<LogoutPage onLogout={mockOnLogout} onNavigate={mockOnNavigate} redirectTo="/home" />);

    await waitFor(() => {
      expect(mockOnNavigate).toHaveBeenCalledWith('/home');
    });
  });

  it('renders nothing', () => {
    const mockOnLogout = jest.fn();
    const { container } = render(<LogoutPage onLogout={mockOnLogout} />);
    expect(container.firstChild).toBeNull();
  });
});
