import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmationDialog } from '../../src/components/ConfirmationDialog';

describe('ConfirmationDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  it('renders when open', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Test Title')).toBeDefined();
    expect(screen.getByText('Test Message')).toBeDefined();
  });

  it('does not render when closed', () => {
    render(
      <ConfirmationDialog
        open={false}
        title="Test Title"
        message="Test Message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText('Test Title')).toBeNull();
  });

  it('calls onConfirm when confirm button clicked', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Test Title"
        message="Test Message"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('renders custom button text', () => {
    render(
      <ConfirmationDialog
        open={true}
        title="Test Title"
        message="Test Message"
        confirmText="Yes"
        cancelText="No"
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Yes')).toBeDefined();
    expect(screen.getByText('No')).toBeDefined();
  });
});
