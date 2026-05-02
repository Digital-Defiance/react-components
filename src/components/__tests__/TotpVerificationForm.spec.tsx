import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  TotpVerificationForm,
  TotpVerificationFormProps,
} from '../TotpVerificationForm';

const defaultProps: TotpVerificationFormProps = {
  pendingTotpToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-pending-token',
  onSubmit: jest.fn().mockResolvedValue({ token: 'full-jwt', user: {} }),
};

describe('TotpVerificationForm', () => {
  // Suppress act() warnings from Formik's internal state management
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('not wrapped in act')
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a 6-digit code input field', () => {
    render(<TotpVerificationForm {...defaultProps} />);

    const input = screen.getByLabelText(/authentication code/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('maxlength', '6');
  });

  it('renders a submit button', () => {
    render(<TotpVerificationForm {...defaultProps} />);

    const button = screen.getByRole('button', { name: /verify/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders the title heading', () => {
    render(<TotpVerificationForm {...defaultProps} />);

    expect(
      screen.getByRole('heading', {
        name: /two-factor authentication/i,
      })
    ).toBeInTheDocument();
  });

  it('calls onSubmit with the entered code and pendingTotpToken', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockResolvedValue({ token: 'full-jwt', user: {} });
    render(
      <TotpVerificationForm {...defaultProps} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '654321' } });

    const button = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        '654321',
        defaultProps.pendingTotpToken
      );
    });
  });

  it('displays error message when onSubmit returns an error', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockResolvedValue({ error: 'Invalid TOTP code' });
    render(
      <TotpVerificationForm {...defaultProps} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '000000' } });

    const button = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Invalid TOTP code')).toBeInTheDocument();
    });

    // Error message should have role="alert" for accessibility
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays fallback error message when onSubmit throws', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));
    render(
      <TotpVerificationForm {...defaultProps} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const button = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting (loading state)', async () => {
    let resolveSubmit: (value: { token: string; user: object }) => void;
    const mockOnSubmit = jest.fn(
      () =>
        new Promise<{ token: string; user: object }>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(
      <TotpVerificationForm {...defaultProps} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const button = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Resolve the promise to complete submission
    resolveSubmit!({ token: 'jwt', user: {} });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('error message is associated with input via aria-describedby', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockResolvedValue({ error: 'Code expired' });
    render(
      <TotpVerificationForm {...defaultProps} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '111111' } });

    const button = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(button);

    await waitFor(() => {
      const errorElement = screen.getByText('Code expired');
      expect(errorElement).toHaveAttribute('id', 'totp-verification-error');
    });

    // The input should reference the error via aria-describedby
    expect(input).toHaveAttribute(
      'aria-describedby',
      'totp-verification-error'
    );
  });

  it('validates that code must be exactly 6 digits', async () => {
    render(<TotpVerificationForm {...defaultProps} />);

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(
        screen.getByText(/code must be exactly 6 digits/i)
      ).toBeInTheDocument();
    });
  });

  it('validates that code is required', async () => {
    render(<TotpVerificationForm {...defaultProps} />);

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.focus(input);
    fireEvent.blur(input);

    await waitFor(() => {
      expect(
        screen.getByText(/authentication code is required/i)
      ).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    render(
      <TotpVerificationForm
        {...defaultProps}
        labels={{
          title: 'Enter Your Code',
          codeLabel: 'TOTP Code',
          submitButton: 'Submit Code',
        }}
      />
    );

    expect(screen.getByText('Enter Your Code')).toBeInTheDocument();
    expect(screen.getByLabelText('TOTP Code')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Submit Code' })
    ).toBeInTheDocument();
  });

  it('uses custom error message label on unexpected error', async () => {
    const mockOnSubmit = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));
    render(
      <TotpVerificationForm
        {...defaultProps}
        onSubmit={mockOnSubmit}
        labels={{ errorMessage: 'Something went wrong' }}
      />
    );

    const input = screen.getByLabelText(/authentication code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const button = screen.getByRole('button', { name: /verify/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('input has aria-label for accessibility', () => {
    render(<TotpVerificationForm {...defaultProps} />);

    const input = screen.getByLabelText(/authentication code/i);
    expect(input).toHaveAttribute('aria-label', 'Authentication code');
  });
});
