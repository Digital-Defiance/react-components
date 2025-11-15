import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../../src/components/DashboardPage';

describe('DashboardPage', () => {
  it('renders with default title', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('renders with custom title', () => {
    render(<DashboardPage title="Custom Dashboard" />);
    expect(screen.getByText('Custom Dashboard')).toBeDefined();
  });

  it('renders children', () => {
    render(
      <DashboardPage>
        <div>Test Content</div>
      </DashboardPage>
    );
    expect(screen.getByText('Test Content')).toBeDefined();
  });
});
