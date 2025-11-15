import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render } from '@testing-library/react';
import { Flag } from '../../src/components/Flag';

describe('Flag', () => {
  it('renders flag for valid language', () => {
    const { container } = render(<Flag language="en-US" />);
    expect(container.querySelector('span')).toBeDefined();
  });

  it('returns null for invalid language', () => {
    const { container } = render(<Flag language="invalid" />);
    expect(container.firstChild).toBeNull();
  });

  it('applies custom styles', () => {
    const { container } = render(<Flag language="en-US" sx={{ fontSize: '2rem' }} />);
    const span = container.querySelector('span');
    expect(span).toBeDefined();
  });

  it('has accessibility label', () => {
    const { container } = render(<Flag language="en-US" />);
    const span = container.querySelector('span[aria-label]');
    expect(span?.getAttribute('aria-label')).toContain('Flag for');
  });
});
