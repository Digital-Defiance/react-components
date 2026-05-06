import { SecureString } from '@digitaldefiance/ecies-lib';
import { FC } from 'react';
import {
  RegisterForm,
  RegisterFormProps,
  RegisterFormValues,
} from '../components/RegisterForm';
import { useAuth, useSuiteConfig } from '../contexts';

export interface RegisterFormWrapperProps {
  onSuccess?: () => void;
  /**
   * When true, offer the TOTP setup step after successful registration.
   * Typically sourced from window.APP_CONFIG.totpAvailable.
   * Defaults to false.
   *
   * NOTE: This requires the registration endpoint to return a session token
   * so the user is authenticated when the TOTP setup call is made. If
   * registration does not issue a token (the default in this suite), leave
   * this false and direct users to enable TOTP from their settings page
   * after logging in.
   */
  enableTotpSetup?: boolean;
  componentProps?: Partial<
    Omit<RegisterFormProps, 'onSubmit' | 'timezones' | 'getInitialTimezone'>
  >;
}

export const RegisterFormWrapper: FC<RegisterFormWrapperProps> = ({
  onSuccess,
  enableTotpSetup = false,
  componentProps = {},
}) => {
  const { register, setUpBrowserPasswordLogin, setupTotp, confirmTotp } = useAuth();
  const { timezones } = useSuiteConfig();

  const handleSubmit = async (values: RegisterFormValues, usePassword: boolean) => {
    const result = await register(
      values.username,
      values.email,
      values.timezone || 'UTC',
      values.password,
      values.mnemonic,
      values.displayName,
    );
    if ('error' in result) {
      return result;
    }

    // After successful registration with a password, set up the browser-side
    // password login bundle (encrypts mnemonic with password and stores in localStorage).
    // This is required for subsequent password-based logins to work.
    if (usePassword && values.password && result.mnemonic) {
      const setupResult = await setUpBrowserPasswordLogin(
        new SecureString(result.mnemonic),
        new SecureString(values.password),
      );
      if ('error' in setupResult) {
        // Password login setup failed — still return success for registration
        // but log the issue. The user can set up password login later.
        console.warn(
          'Registration succeeded but browser password login setup failed:',
          setupResult.error,
        );
      }
    }

    if (onSuccess) {
      onSuccess();
    }
    // Don't navigate away — let RegisterForm show the success message
    // (mnemonic grid or email verification notice). The user navigates
    // manually via the "Proceed to login" / "I Have Saved My Recovery
    // Phrase" button.
    return result;
  };

  const defaultTimezones = timezones || [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
  ];

  const totpProps = enableTotpSetup
    ? {
        enableTotpSetup: true,
        onTotpSetup: setupTotp,
        onTotpConfirm: confirmTotp,
      }
    : {};

  return (
    <RegisterForm
      onSubmit={handleSubmit}
      timezones={defaultTimezones}
      getInitialTimezone={() =>
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      }
      {...totpProps}
      {...componentProps}
    />
  );
};
