import { FC } from 'react';
import {
  RegisterForm,
  RegisterFormProps,
  RegisterFormValues,
} from '../components/RegisterForm';
import { useAuth, useSuiteConfig } from '../contexts';

export interface RegisterFormWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<
    Omit<RegisterFormProps, 'onSubmit' | 'timezones' | 'getInitialTimezone'>
  >;
}

export const RegisterFormWrapper: FC<RegisterFormWrapperProps> = ({
  onSuccess,
  componentProps = {},
}) => {
  const { register } = useAuth();
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

  return (
    <RegisterForm
      onSubmit={handleSubmit}
      timezones={defaultTimezones}
      getInitialTimezone={() =>
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      }
      {...componentProps}
    />
  );
};
