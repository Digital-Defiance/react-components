import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../RegisterForm';
import { I18nProvider } from '../../contexts';
import { I18nEngine } from '@digitaldefiance/i18n-lib';

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

const mockTimezones = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'UTC',
];

const mockGetInitialTimezone = (): string => 'UTC';

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

/**
 * Helper: fill the registration form with valid data and submit.
 */
const fillAndSubmitRegistration = async () => {
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'testuser' },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: 'test@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/display name/i), {
    target: { value: 'Test User' },
  });
  fireEvent.change(screen.getByLabelText(/^password/i), {
    target: { value: 'Password123!' },
  });
  fireEvent.change(screen.getByLabelText(/confirm/i), {
    target: { value: 'Password123!' },
  });
  fireEvent.click(screen.getByRole('button', { name: /register/i }));
};

describe('RegisterForm TOTP integration', () => {
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

  /**
   * Validates: Requirement 14.3
   * No TOTP UI when enableTotpSetup is not passed (backward compatible).
   */
  it('does not show TOTP setup when enableTotpSetup is not passed', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
      mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
    });

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
      />
    );

    await fillAndSubmitRegistration();

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    // Should NOT show TOTP setup UI
    expect(
      screen.queryByText(/set up two-factor authentication/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('skip-totp-button')).not.toBeInTheDocument();
  });

  /**
   * Validates: Requirement 14.3
   * No TOTP UI when enableTotpSetup is explicitly false.
   */
  it('does not show TOTP setup when enableTotpSetup is false', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
      mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
    });

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
        enableTotpSetup={false}
      />
    );

    await fillAndSubmitRegistration();

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    expect(
      screen.queryByText(/set up two-factor authentication/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('skip-totp-button')).not.toBeInTheDocument();
  });

  /**
   * Validates: Requirement 7.1
   * TOTP setup step is shown after successful registration when enableTotpSetup=true.
   */
  it('shows TOTP setup step after successful registration when enableTotpSetup=true', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
    });
    const mockOnTotpSetup = jest.fn().mockResolvedValue({
      provisioningUri:
        'otpauth://totp/TestIssuer:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TestIssuer',
      secret: 'JBSWY3DPEHPK3PXP',
    });
    const mockOnTotpConfirm = jest
      .fn()
      .mockResolvedValue({ success: true });

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
        enableTotpSetup={true}
        onTotpSetup={mockOnTotpSetup}
        onTotpConfirm={mockOnTotpConfirm}
      />
    );

    await fillAndSubmitRegistration();

    await waitFor(() => {
      expect(mockOnTotpSetup).toHaveBeenCalled();
    });

    // TOTP setup UI should be visible (text appears in both RegisterForm heading and TotpSetupForm heading)
    await waitFor(() => {
      expect(
        screen.getAllByText(/set up two-factor authentication/i).length
      ).toBeGreaterThanOrEqual(1);
    });

    // QR code and secret should be rendered
    expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();

    // Skip button should be present
    expect(screen.getByTestId('skip-totp-button')).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 7.2
   * TOTP setup step is skippable — clicking Skip proceeds to post-registration flow.
   */
  it('allows skipping TOTP setup via the Skip button', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
      mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
    });
    const mockOnTotpSetup = jest.fn().mockResolvedValue({
      provisioningUri:
        'otpauth://totp/TestIssuer:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TestIssuer',
      secret: 'JBSWY3DPEHPK3PXP',
    });

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
        enableTotpSetup={true}
        onTotpSetup={mockOnTotpSetup}
        onTotpConfirm={jest.fn()}
      />
    );

    await fillAndSubmitRegistration();

    // Wait for TOTP setup to appear (text appears in both RegisterForm heading and TotpSetupForm heading)
    await waitFor(() => {
      expect(
        screen.getAllByText(/set up two-factor authentication/i).length
      ).toBeGreaterThanOrEqual(1);
    });

    // Click Skip
    fireEvent.click(screen.getByTestId('skip-totp-button'));

    // TOTP setup should be hidden, post-registration flow should show
    await waitFor(() => {
      expect(
        screen.queryAllByText(/set up two-factor authentication/i)
      ).toHaveLength(0);
    });

    // Mnemonic display (post-registration flow) should be visible
    expect(screen.getByText('word1')).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 7.5
   * onTotpSetupComplete is called after successful TOTP confirmation.
   */
  it('calls onTotpSetupComplete after successful TOTP confirmation', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
    });
    const mockOnTotpSetup = jest.fn().mockResolvedValue({
      provisioningUri:
        'otpauth://totp/TestIssuer:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TestIssuer',
      secret: 'JBSWY3DPEHPK3PXP',
    });
    const mockOnTotpConfirm = jest
      .fn()
      .mockResolvedValue({ success: true });
    const mockOnTotpSetupComplete = jest.fn();

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
        enableTotpSetup={true}
        onTotpSetup={mockOnTotpSetup}
        onTotpConfirm={mockOnTotpConfirm}
        onTotpSetupComplete={mockOnTotpSetupComplete}
      />
    );

    await fillAndSubmitRegistration();

    // Wait for TOTP setup to appear
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
    });

    // Enter a 6-digit code and confirm
    const codeInput = screen.getByLabelText(/confirmation code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockOnTotpConfirm).toHaveBeenCalledWith('123456');
    });

    await waitFor(() => {
      expect(mockOnTotpSetupComplete).toHaveBeenCalled();
    });

    // TOTP setup should be hidden after success, success message shown
    await waitFor(() => {
      expect(
        screen.getByText(/two-factor authentication has been enabled/i)
      ).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 7.4
   * Error handling: displays error when onTotpSetup returns an error.
   */
  it('displays error when TOTP setup initiation fails', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
    });
    const mockOnTotpSetup = jest
      .fn()
      .mockResolvedValue({ error: 'Setup service unavailable' });

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
        enableTotpSetup={true}
        onTotpSetup={mockOnTotpSetup}
        onTotpConfirm={jest.fn()}
      />
    );

    await fillAndSubmitRegistration();

    await waitFor(() => {
      expect(mockOnTotpSetup).toHaveBeenCalled();
    });

    // Error message should be displayed
    await waitFor(() => {
      expect(
        screen.getByText('Setup service unavailable')
      ).toBeInTheDocument();
    });

    // Skip button should still be available to proceed
    expect(screen.getByTestId('skip-totp-button')).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 7.4
   * Error handling: displays fallback error when onTotpSetup throws.
   */
  it('displays fallback error when TOTP setup throws an exception', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({
      success: true,
      message: 'Registered',
    });
    const mockOnTotpSetup = jest
      .fn()
      .mockRejectedValue(new Error('Network error'));

    renderWithI18n(
      <RegisterForm
        timezones={mockTimezones}
        getInitialTimezone={mockGetInitialTimezone}
        onSubmit={mockOnSubmit}
        enableTotpSetup={true}
        onTotpSetup={mockOnTotpSetup}
        onTotpConfirm={jest.fn()}
      />
    );

    await fillAndSubmitRegistration();

    await waitFor(() => {
      expect(mockOnTotpSetup).toHaveBeenCalled();
    });

    // Fallback error message should be displayed
    await waitFor(() => {
      expect(
        screen.getByText(/failed to set up two-factor authentication/i)
      ).toBeInTheDocument();
    });
  });
});
