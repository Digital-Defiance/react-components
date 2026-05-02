import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSettingsForm, UserSettingsFormProps } from '../UserSettingsForm';
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

const defaultInitialValues = {
  email: 'user@example.com',
  timezone: 'UTC',
  siteLanguage: 'en',
  currency: 'USD',
  darkMode: false,
  directChallenge: false,
};

const defaultLanguages = [{ code: 'en', label: 'English' }];

const baseProps: Pick<UserSettingsFormProps, 'initialValues' | 'onSubmit' | 'languages'> = {
  initialValues: defaultInitialValues,
  onSubmit: jest.fn().mockResolvedValue({ success: true, message: 'Saved' }),
  languages: defaultLanguages,
};

const renderWithI18n = (component: React.ReactElement) => {
  const engine = I18nEngine.getInstance('default');
  return render(<I18nProvider i18nEngine={engine}>{component}</I18nProvider>);
};

describe('UserSettingsForm TOTP integration', () => {
  // Suppress act() warnings from Formik's internal state management
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('not wrapped in act') ||
         args[0].includes('cannot be a descendant'))
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
   * Validates: Requirement 14.5
   * No TOTP controls when totpEnabled prop is undefined (backward compatible).
   */
  it('does not render TOTP controls when totpEnabled is undefined', () => {
    renderWithI18n(<UserSettingsForm {...baseProps} />);

    expect(
      screen.queryByText(/two-factor authentication/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('enable-totp-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('disable-totp-button')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('reset-totp-button')
    ).not.toBeInTheDocument();
  });

  /**
   * Validates: Requirement 10.1
   * TOTP status is displayed when totpEnabled is provided.
   */
  it('displays TOTP status as disabled when totpEnabled=false', () => {
    renderWithI18n(
      <UserSettingsForm {...baseProps} totpEnabled={false} />
    );

    expect(
      screen.getByText(/two-factor authentication/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2fa is currently disabled/i)
    ).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 10.1
   * TOTP status is displayed as enabled when totpEnabled=true.
   */
  it('displays TOTP status as enabled when totpEnabled=true', () => {
    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={jest.fn()}
        onTotpReset={jest.fn()}
      />
    );

    expect(
      screen.getByText(/two-factor authentication/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2fa is currently enabled/i)
    ).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 10.2
   * "Enable 2FA" button is shown when totpEnabled=false.
   */
  it('renders "Enable 2FA" button when totpEnabled=false', () => {
    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={false}
        onTotpSetup={jest.fn()}
      />
    );

    const enableButton = screen.getByTestId('enable-totp-button');
    expect(enableButton).toBeInTheDocument();
    expect(enableButton).toHaveTextContent(/enable 2fa/i);
  });

  /**
   * Validates: Requirement 10.3
   * "Disable 2FA" and "Reset 2FA" buttons are shown when totpEnabled=true.
   */
  it('renders "Disable 2FA" and "Reset 2FA" buttons when totpEnabled=true', () => {
    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={jest.fn()}
        onTotpReset={jest.fn()}
      />
    );

    const disableButton = screen.getByTestId('disable-totp-button');
    expect(disableButton).toBeInTheDocument();
    expect(disableButton).toHaveTextContent(/disable 2fa/i);

    const resetButton = screen.getByTestId('reset-totp-button');
    expect(resetButton).toBeInTheDocument();
    expect(resetButton).toHaveTextContent(/reset 2fa/i);
  });

  /**
   * Validates: Requirement 10.2
   * Clicking "Enable 2FA" calls onTotpSetup and renders TotpSetupForm inline.
   */
  it('shows TotpSetupForm inline after clicking "Enable 2FA"', async () => {
    const mockOnTotpSetup = jest.fn().mockResolvedValue({
      provisioningUri:
        'otpauth://totp/TestIssuer:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TestIssuer',
      secret: 'JBSWY3DPEHPK3PXP',
    });

    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={false}
        onTotpSetup={mockOnTotpSetup}
        onTotpConfirm={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('enable-totp-button'));

    await waitFor(() => {
      expect(mockOnTotpSetup).toHaveBeenCalled();
    });

    // TotpSetupForm should be rendered inline with QR code and secret
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
    });
    expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 10.6
   * Clicking "Disable 2FA" shows a 6-digit code prompt.
   */
  it('shows code prompt when clicking "Disable 2FA"', () => {
    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={jest.fn()}
        onTotpReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('disable-totp-button'));

    // Code input should appear
    expect(
      screen.getByText(/enter your current 2fa code to disable/i)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('disable-totp-submit-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('cancel-disable-totp-button')
    ).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 10.6
   * Disable flow: entering code and submitting calls onTotpDisable.
   */
  it('calls onTotpDisable with the entered code', async () => {
    const mockOnTotpDisable = jest
      .fn()
      .mockResolvedValue({ success: true });

    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={mockOnTotpDisable}
        onTotpReset={jest.fn()}
      />
    );

    // Open disable prompt
    fireEvent.click(screen.getByTestId('disable-totp-button'));

    // Enter code
    const codeInput = screen.getByLabelText(/totp code/i);
    fireEvent.change(codeInput, { target: { value: '654321' } });

    // Submit
    fireEvent.click(screen.getByTestId('disable-totp-submit-button'));

    await waitFor(() => {
      expect(mockOnTotpDisable).toHaveBeenCalledWith('654321');
    });

    // After successful disable, status should update to disabled
    await waitFor(() => {
      expect(
        screen.getByText(/2fa is currently disabled/i)
      ).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 15.8
   * Clicking "Reset 2FA" shows a 6-digit code prompt.
   */
  it('shows code prompt when clicking "Reset 2FA"', () => {
    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={jest.fn()}
        onTotpReset={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('reset-totp-button'));

    // Code input should appear
    expect(
      screen.getByText(/enter your current 2fa code to reset/i)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('reset-totp-submit-button')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('cancel-reset-totp-button')
    ).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 15.8
   * Reset flow: entering code and submitting calls onTotpReset, then shows TotpSetupForm.
   */
  it('calls onTotpReset with code and shows TotpSetupForm on success', async () => {
    const mockOnTotpReset = jest.fn().mockResolvedValue({
      provisioningUri:
        'otpauth://totp/TestIssuer:user@example.com?secret=NEWBASE32SECRET&issuer=TestIssuer',
      secret: 'NEWBASE32SECRET',
    });

    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={jest.fn()}
        onTotpReset={mockOnTotpReset}
        onTotpConfirm={jest.fn()}
      />
    );

    // Open reset prompt
    fireEvent.click(screen.getByTestId('reset-totp-button'));

    // Enter code
    const codeInput = screen.getByLabelText(/totp code/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });

    // Submit
    fireEvent.click(screen.getByTestId('reset-totp-submit-button'));

    await waitFor(() => {
      expect(mockOnTotpReset).toHaveBeenCalledWith('123456');
    });

    // TotpSetupForm should appear with the new provisioning URI and secret
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();
    });
    expect(screen.getByText('NEWBASE32SECRET')).toBeInTheDocument();
  });

  /**
   * Validates: Requirement 10.6
   * Disable flow: displays error when onTotpDisable returns an error.
   */
  it('displays error when disable fails', async () => {
    const mockOnTotpDisable = jest
      .fn()
      .mockResolvedValue({ error: 'Invalid TOTP code' });

    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={mockOnTotpDisable}
        onTotpReset={jest.fn()}
      />
    );

    // Open disable prompt
    fireEvent.click(screen.getByTestId('disable-totp-button'));

    // Enter code and submit
    const codeInput = screen.getByLabelText(/totp code/i);
    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(screen.getByTestId('disable-totp-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Invalid TOTP code')).toBeInTheDocument();
    });
  });

  /**
   * Validates: Requirement 15.8
   * Reset flow: displays error when onTotpReset returns an error.
   */
  it('displays error when reset fails', async () => {
    const mockOnTotpReset = jest
      .fn()
      .mockResolvedValue({ error: 'Invalid TOTP code' });

    renderWithI18n(
      <UserSettingsForm
        {...baseProps}
        totpEnabled={true}
        onTotpDisable={jest.fn()}
        onTotpReset={mockOnTotpReset}
      />
    );

    // Open reset prompt
    fireEvent.click(screen.getByTestId('reset-totp-button'));

    // Enter code and submit
    const codeInput = screen.getByLabelText(/totp code/i);
    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(screen.getByTestId('reset-totp-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('Invalid TOTP code')).toBeInTheDocument();
    });
  });
});
