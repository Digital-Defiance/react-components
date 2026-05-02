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
  const { register, setupTotp, confirmTotp } = useAuth();
  const { timezones } = useSuiteConfig();

  const handleSubmit = async (values: RegisterFormValues) => {
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
