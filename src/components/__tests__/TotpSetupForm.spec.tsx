import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TotpSetupForm, TotpSetupFormProps } from '../TotpSetupForm';

// Mock qrcode.react to avoid SVG rendering complexity in jsdom
jest.mock('qrcode.react', () => ({
  QRCodeSVG: (props: Record<string, unknown>) => (
    <svg
      data-testid="qr-code-svg"
      role={props.role as string}
      aria-label={props['aria-label'] as string}
    />
  ),
}));

const defaultProps: TotpSetupFormProps = {
  provisioningUri:
    'otpauth://totp/TestIssuer:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TestIssuer',
  secret: 'JBSWY3DPEHPK3PXP',
  onConfirm: jest.fn().mockResolvedValue({ success: true }),
};

describe('TotpSetupForm', () => {
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

  it('renders QR code from provisioningUri', () => {
    render(<TotpSetupForm {...defaultProps} />);

    const qrCode = screen.getByTestId('qr-code-svg');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode).toHaveAttribute('role', 'img');
  });

  it('renders QR code with descriptive aria-label', () => {
    render(<TotpSetupForm {...defaultProps} />);

    const qrCode = screen.getByRole('img', {
      name: /qr code for totp authenticator app setup/i,
    });
    expect(qrCode).toBeInTheDocument();
  });

  it('renders QR code with custom aria-label from labels prop', () => {
    render(
      <TotpSetupForm
        {...defaultProps}
        labels={{ qrCodeAlt: 'Custom QR description' }}
      />
    );

    const qrCode = screen.getByRole('img', { name: 'Custom QR description' });
    expect(qrCode).toBeInTheDocument();
  });

  it('displays the raw base32 secret as a fallback', () => {
    render(<TotpSetupForm {...defaultProps} />);

    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
    expect(screen.getByText(/manual entry key/i)).toBeInTheDocument();
  });

  it('renders a 6-digit confirmation code input with aria-label', () => {
    render(<TotpSetupForm {...defaultProps} />);

    const input = screen.getByLabelText(/confirmation code/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('maxlength', '6');
  });

  it('renders a confirm button', () => {
    render(<TotpSetupForm {...defaultProps} />);

    const button = screen.getByRole('button', { name: /confirm/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('calls onConfirm with the entered code on form submission', async () => {
    const mockOnConfirm = jest.fn().mockResolvedValue({ success: true });
    render(<TotpSetupForm {...defaultProps} onConfirm={mockOnConfirm} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const button = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('123456');
    });
  });

  it('displays error message when onConfirm returns an error', async () => {
    const mockOnConfirm = jest
      .fn()
      .mockResolvedValue({ error: 'Invalid TOTP code' });
    render(<TotpSetupForm {...defaultProps} onConfirm={mockOnConfirm} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(input, { target: { value: '000000' } });

    const button = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Invalid TOTP code')).toBeInTheDocument();
    });

    // Error message should have role="alert" for accessibility
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays fallback error message when onConfirm throws', async () => {
    const mockOnConfirm = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));
    render(<TotpSetupForm {...defaultProps} onConfirm={mockOnConfirm} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const button = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/an unexpected error occurred/i)
      ).toBeInTheDocument();
    });
  });

  it('error message is associated with input via aria-describedby', async () => {
    const mockOnConfirm = jest
      .fn()
      .mockResolvedValue({ error: 'Code expired' });
    render(<TotpSetupForm {...defaultProps} onConfirm={mockOnConfirm} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(input, { target: { value: '111111' } });

    const button = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(button);

    await waitFor(() => {
      const errorElement = screen.getByText('Code expired');
      expect(errorElement).toHaveAttribute('id', 'totp-setup-error');
    });

    // After error appears, the input should reference the error via aria-describedby
    expect(input).toHaveAttribute('aria-describedby', 'totp-setup-error');
  });

  it('validates that code must be exactly 6 digits', async () => {
    render(<TotpSetupForm {...defaultProps} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(
        screen.getByText(/code must be exactly 6 digits/i)
      ).toBeInTheDocument();
    });
  });

  it('validates that code is required', async () => {
    render(<TotpSetupForm {...defaultProps} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.focus(input);
    fireEvent.blur(input);

    await waitFor(() => {
      expect(
        screen.getByText(/confirmation code is required/i)
      ).toBeInTheDocument();
    });
  });

  it('uses custom labels when provided', () => {
    render(
      <TotpSetupForm
        {...defaultProps}
        labels={{
          title: 'Custom Title',
          secretLabel: 'Secret Key',
          codeLabel: 'Enter Code',
          confirmButton: 'Verify',
        }}
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Secret Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter Code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify' })).toBeInTheDocument();
  });

  it('renders the title heading', () => {
    render(<TotpSetupForm {...defaultProps} />);

    expect(
      screen.getByRole('heading', {
        name: /set up two-factor authentication/i,
      })
    ).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    // Create a promise that we control to keep the form in submitting state
    let resolveConfirm: (value: { success: boolean }) => void;
    const mockOnConfirm = jest.fn(
      () =>
        new Promise<{ success: boolean }>((resolve) => {
          resolveConfirm = resolve;
        })
    );
    render(<TotpSetupForm {...defaultProps} onConfirm={mockOnConfirm} />);

    const input = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(input, { target: { value: '123456' } });

    const button = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Resolve the promise to complete submission
    resolveConfirm!({ success: true });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
