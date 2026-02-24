import { FC } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  SuiteCoreStringKey,
  TranslatableSuiteError,
} from '@digitaldefiance/suite-core-lib';
import {
  ResetPasswordForm,
  ResetPasswordFormProps,
} from '../components/ResetPasswordForm';
import { useSuiteConfig } from '../contexts';

export interface ResetPasswordFormWrapperProps {
  onSuccess?: () => void;
  redirectTo?: string;
  componentProps?: Partial<Omit<ResetPasswordFormProps, 'onSubmit' | 'token'>>;
}

export const ResetPasswordFormWrapper: FC<ResetPasswordFormWrapperProps> = ({
  onSuccess,
  redirectTo,
  componentProps = {},
}) => {
  const { baseUrl, routes } = useSuiteConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (resetToken: string, password: string) => {
    const res = await fetch(`${baseUrl}/user/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password }),
    });
    if (!res.ok) {
      const body: { message?: string } = await res.json().catch(() => ({})) as { message?: string };
      if (body.message) {
        throw new Error(body.message);
      }
      throw new TranslatableSuiteError(
        SuiteCoreStringKey.Error_PasswordChange,
      );
    }
    if (onSuccess) {
      onSuccess();
    }
    navigate(redirectTo || routes.login || '/login');
  };

  return (
    <ResetPasswordForm
      token={token}
      onSubmit={handleSubmit}
      {...componentProps}
    />
  );
};
