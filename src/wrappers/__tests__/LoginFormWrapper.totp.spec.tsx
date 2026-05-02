import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginFormWrapper, LoginFormWrapperProps } from '../LoginFormWrapper';

// --- Mocks ---

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockDirectLogin = jest.fn();
const mockPasswordLogin = jest.fn();
jest.mock('../../contexts', () => ({
  useAuth: () => ({
    directLogin: mockDirectLogin,
    passwordLogin: mockPasswordLogin,
  }),
  useSuiteConfig: () => ({
    routes: {
      dashboard: '/dashboard',
      login: '/login',
    },
  }),
}));

// Minimal LoginForm mock that exposes the onSubmit prop
jest.mock('../../components/LoginForm', () => ({
  LoginForm: (props: { onSubmit: (values: Record<string, string>) => Promise<void> }) => (
    <div data-testid="login-form">
      <button
        data-testid="login-password-btn"
        onClick={() =>
          props.onSubmit({ email: 'user@example.com', password: 'secret' })
        }
      >
        Login with password
      </button>
      <button
        data-testid="login-mnemonic-btn"
        onClick={() =>
          props.onSubmit({ username: 'testuser', mnemonic: 'word1 word2 word3' })
        }
      >
        Login with mnemonic
      </button>
    </div>
  ),
}));

// Minimal TotpVerificationForm mock that exposes onSubmit
jest.mock('../../components/TotpVerificationForm', () => ({
  TotpVerificationForm: (props: {
    pendingTotpToken: string;
    onSubmit: (code: string, token: string) => Promise<{ token: string; user: object } | { error: string }>;
  }) => (
    <div data-testid="totp-verification-form">
      <span data-testid="pending-token">{props.pendingTotpToken}</span>
      <button
        data-testid="totp-submit-btn"
        onClick={() => props.onSubmit('123456', props.pendingTotpToken)}
      >
        Verify TOTP
      </button>
    </div>
  ),
}));

describe('LoginFormWrapper TOTP integration', () => {
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

  const defaultProps: LoginFormWrapperProps = {
    onVerifyTotp: jest.fn(),
  };

  /**
   * Validates: Requirement 14.4
   * Existing login flow is unchanged when no pendingTotpToken is returned.
   */
  it('renders LoginForm and navigates to dashboard on normal login (no TOTP)', async () => {
    mockPasswordLogin.mockResolvedValue({
      token: 'full-jwt',
      user: { id: '1', email: 'user@example.com' },
      wallet: {},
    });

    render(<LoginFormWrapper {...defaultProps} />);

    // LoginForm should be rendered
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.queryByTestId('totp-verification-form')).not.toBeInTheDocument();

    // Trigger a password login
    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(mockPasswordLogin).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  /**
   * Validates: Requirement 6.6
   * When passwordLogin returns pendingTotpToken, TotpVerificationForm is rendered.
   */
  it('renders TotpVerificationForm when passwordLogin returns pendingTotpToken', async () => {
    mockPasswordLogin.mockResolvedValue({
      pendingTotpToken: 'pending-jwt-token',
    });

    render(<LoginFormWrapper {...defaultProps} />);

    // Trigger a password login that returns a pending TOTP token
    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('totp-verification-form')).toBeInTheDocument();
    });

    // LoginForm should no longer be visible
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();

    // The pending token should be passed to the form
    expect(screen.getByTestId('pending-token')).toHaveTextContent(
      'pending-jwt-token'
    );
  });

  /**
   * Validates: Requirement 6.6
   * When directLogin returns pendingTotpToken, TotpVerificationForm is rendered.
   */
  it('renders TotpVerificationForm when directLogin returns pendingTotpToken', async () => {
    mockDirectLogin.mockResolvedValue({
      pendingTotpToken: 'pending-mnemonic-token',
    });

    render(<LoginFormWrapper {...defaultProps} />);

    // Trigger a mnemonic login that returns a pending TOTP token
    fireEvent.click(screen.getByTestId('login-mnemonic-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('totp-verification-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pending-token')).toHaveTextContent(
      'pending-mnemonic-token'
    );
  });

  /**
   * Validates: Requirement 6.3
   * On successful TOTP verification, navigates to dashboard.
   */
  it('navigates to dashboard on successful TOTP verification', async () => {
    mockPasswordLogin.mockResolvedValue({
      pendingTotpToken: 'pending-jwt-token',
    });

    const mockVerifyTotp = jest.fn().mockResolvedValue({
      token: 'full-jwt-after-totp',
      user: { id: '1', email: 'user@example.com' },
    });

    render(
      <LoginFormWrapper {...defaultProps} onVerifyTotp={mockVerifyTotp} />
    );

    // First, trigger login to get pending token
    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('totp-verification-form')).toBeInTheDocument();
    });

    // Now submit the TOTP code
    fireEvent.click(screen.getByTestId('totp-submit-btn'));

    await waitFor(() => {
      expect(mockVerifyTotp).toHaveBeenCalledWith('123456', 'pending-jwt-token');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  /**
   * Validates: Requirement 14.4
   * Navigates to custom redirectTo path after successful login without TOTP.
   */
  it('navigates to custom redirectTo on normal login', async () => {
    mockPasswordLogin.mockResolvedValue({
      token: 'full-jwt',
      user: { id: '1' },
      wallet: {},
    });

    render(<LoginFormWrapper {...defaultProps} redirectTo="/custom-page" />);

    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/custom-page');
    });
  });

  /**
   * Validates: Requirement 6.3
   * Navigates to custom redirectTo after successful TOTP verification.
   */
  it('navigates to custom redirectTo after successful TOTP verification', async () => {
    mockPasswordLogin.mockResolvedValue({
      pendingTotpToken: 'pending-jwt-token',
    });

    const mockVerifyTotp = jest.fn().mockResolvedValue({
      token: 'full-jwt-after-totp',
      user: { id: '1' },
    });

    render(
      <LoginFormWrapper
        {...defaultProps}
        onVerifyTotp={mockVerifyTotp}
        redirectTo="/custom-page"
      />
    );

    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('totp-verification-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('totp-submit-btn'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/custom-page');
    });
  });

  /**
   * Validates: Requirement 14.4
   * Calls onSuccess callback on normal login.
   */
  it('calls onSuccess callback on normal login', async () => {
    mockPasswordLogin.mockResolvedValue({
      token: 'full-jwt',
      user: { id: '1' },
      wallet: {},
    });

    const mockOnSuccess = jest.fn();

    render(
      <LoginFormWrapper {...defaultProps} onSuccess={mockOnSuccess} />
    );

    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  /**
   * Validates: Requirement 6.3
   * Calls onSuccess callback after successful TOTP verification.
   */
  it('calls onSuccess callback after successful TOTP verification', async () => {
    mockPasswordLogin.mockResolvedValue({
      pendingTotpToken: 'pending-jwt-token',
    });

    const mockVerifyTotp = jest.fn().mockResolvedValue({
      token: 'full-jwt-after-totp',
      user: { id: '1' },
    });
    const mockOnSuccess = jest.fn();

    render(
      <LoginFormWrapper
        {...defaultProps}
        onVerifyTotp={mockVerifyTotp}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('login-password-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('totp-verification-form')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('totp-submit-btn'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
