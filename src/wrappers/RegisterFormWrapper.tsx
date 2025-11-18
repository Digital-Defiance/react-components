import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm, RegisterFormValues, RegisterFormProps } from '../components/RegisterForm';
import { useAuth, useSuiteConfig } from '../contexts';

export interface RegisterFormWrapperProps {
  onSuccess?: () => void;
  redirectTo?: string;
  componentProps?: Partial<Omit<RegisterFormProps, 'onSubmit' | 'timezones' | 'getInitialTimezone'>>;
}

export const RegisterFormWrapper: FC<RegisterFormWrapperProps> = ({ 
  onSuccess,
  redirectTo,
  componentProps = {},
}) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { routes, timezones } = useSuiteConfig();

  const handleSubmit = async (values: RegisterFormValues, usePassword: boolean) => {
    const result = await register(
      values.username,
      values.email,
      values.timezone || 'UTC',
      values.password
    );
    if ('error' in result) {
      throw new Error(result.error);
    }
    if (onSuccess) {
      onSuccess();
    }
    navigate(redirectTo || routes.verifyEmail || '/verify-email');
    return result;
  };

  const defaultTimezones = timezones || ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London'];

  return (
    <RegisterForm 
      onSubmit={handleSubmit}
      timezones={defaultTimezones}
      getInitialTimezone={() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
      {...componentProps}
    />
  );
};
