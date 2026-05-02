import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecureString, EmailString } from '@digitaldefiance/ecies-lib';
import { IRequestUserDTO, SuiteCoreStringKey, TranslatableSuiteError } from '@digitaldefiance/suite-core-lib';
import { LoginForm, LoginFormValues, LoginFormProps } from '../components/LoginForm';
import { TotpVerificationForm } from '../components/TotpVerificationForm';
import { useAuth, useSuiteConfig } from '../contexts';

export interface LoginFormWrapperProps {
  onSuccess?: () => void;
  redirectTo?: string;
  componentProps?: Partial<Omit<LoginFormProps, 'onSubmit'>>;
  /**
   * Called when the user submits a TOTP verification code during login.
   * Typically wired to `AuthService.verifyTotpLogin(pendingTotpToken, code)`.
   * When not provided, the wrapper cannot complete TOTP-protected logins.
   */
  onVerifyTotp?: (
    code: string,
    pendingTotpToken: string,
  ) => Promise<{ token: string; user: IRequestUserDTO } | { error: string }>;
}

export const LoginFormWrapper: FC<LoginFormWrapperProps> = ({ 
  onSuccess,
  redirectTo,
  componentProps = {},
  onVerifyTotp,
}) => {
  const { directLogin, passwordLogin, verifyTotpLogin, setUser } = useAuth();
  const navigate = useNavigate();
  const { routes } = useSuiteConfig();
  const [pendingTotpToken, setPendingTotpToken] = useState<string | null>(null);

  const handleLoginSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    navigate(redirectTo || routes.dashboard || '/dashboard');
  };

  const handleSubmit = async (values: LoginFormValues) => {
    const email = values.email && values.email.trim().length > 0 ? new EmailString(values.email) : undefined;
    const username = values.username && values.username.trim() ? values.username : undefined;
    
    if (values.password) {
      const result = await passwordLogin(
        new SecureString(values.password),
        username,
        email
      );
      if ('error' in result) {
        throw new Error(result.error);
      }
      if ('pendingTotpToken' in result) {
        setPendingTotpToken(result.pendingTotpToken);
        return;
      }
      handleLoginSuccess();
    } else if (values.mnemonic) {
      const result = await directLogin(
        new SecureString(values.mnemonic),
        username,
        email
      );
      if ('error' in result) {
        throw new Error(result.error);
      }
      if ('pendingTotpToken' in result) {
        setPendingTotpToken(result.pendingTotpToken);
        return;
      }
      handleLoginSuccess();
    } else {
      throw new TranslatableSuiteError(SuiteCoreStringKey.Error_NoPasswordOrMnemonicProvided);
    }
  };

  const handleTotpSubmit = async (
    code: string,
    token: string,
  ): Promise<{ token: string; user: IRequestUserDTO } | { error: string }> => {
    // Use the explicitly provided callback, or fall back to verifyTotpLogin from AuthContext
    const verifyFn = onVerifyTotp ?? ((c: string, t: string) => verifyTotpLogin(t, c));
    const result = await verifyFn(code, token);
    if ('error' in result) {
      return result;
    }
    // Store the full JWT and complete the login flow
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    // Update auth context so PrivateRoute guards see the user as authenticated
    await setUser(result.user);
    handleLoginSuccess();
    return result;
  };

  if (pendingTotpToken) {
    return (
      <TotpVerificationForm
        pendingTotpToken={pendingTotpToken}
        onSubmit={handleTotpSubmit}
      />
    );
  }

  return <LoginForm onSubmit={handleSubmit} {...componentProps} />;
};
