import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppThemeProvider, useTheme, ThemeToggleButton } from '../../src/contexts/ThemeProvider';
import { createTheme, PaletteMode } from '@mui/material';

const TestComponent = () => {
  const { mode, toggleColorMode } = useTheme();
  return (
    <div>
      <div data-testid="mode">{mode}</div>
      <button onClick={toggleColorMode}>Toggle</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  it('should initialize with light mode', () => {
    render(
      <AppThemeProvider>
        <TestComponent />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('should toggle between light and dark modes', () => {
    render(
      <AppThemeProvider>
        <TestComponent />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');

    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');

    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('should use custom theme when provided', () => {
    const customTheme = (mode: PaletteMode) => createTheme({
      palette: {
        mode,
        primary: { main: '#ff0000' },
      },
    });

    const { container } = render(
      <AppThemeProvider customTheme={customTheme}>
        <TestComponent />
      </AppThemeProvider>
    );

    expect(container).toBeDefined();
  });

  it('should throw error when useTheme is used outside provider', () => {
    const consoleError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within an AppThemeProvider');

    console.error = consoleError;
  });

  it('should render ThemeToggleButton', () => {
    render(
      <AppThemeProvider>
        <ThemeToggleButton />
      </AppThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
  });

  it('should toggle theme when ThemeToggleButton is clicked', () => {
    render(
      <AppThemeProvider>
        <TestComponent />
        <ThemeToggleButton />
      </AppThemeProvider>
    );

    expect(screen.getByTestId('mode').textContent).toBe('light');

    const buttons = screen.getAllByRole('button');
    const iconButton = buttons.find(btn => btn.querySelector('svg'));
    fireEvent.click(iconButton!);

    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });
});
