import { FC } from 'react';
import {
  SuiteCoreStringKey,
  TranslatableSuiteError,
} from '@digitaldefiance/suite-core-lib';
import {
  ForgotPasswordForm,
  ForgotPasswordFormProps,
  ForgotPasswordFormValues,
} from '../components/ForgotPasswordForm';
import { useSuiteConfig } from '../contexts';

export interface ForgotPasswordFormWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<Omit<ForgotPasswordFormProps, 'onSubmit'>>;
}

export const ForgotPasswordFormWrapper: FC<ForgotPasswordFormWrapperProps> = ({
  onSuccess,
  componentProps = {},
}) => {
  const { baseUrl } = useSuiteConfig();

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    const res = await fetch(`${baseUrl}/user/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email }),
    });
    if (!res.ok) {
      const body: { message?: string } = await res.json().catch(() => ({})) as { message?: string };
      if (body.message) {
        throw new Error(body.message);
      }
      throw new TranslatableSuiteError(
        SuiteCoreStringKey.ForgotPassword_Error,
      );
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  return <ForgotPasswordForm onSubmit={handleSubmit} {...componentProps} />;
};
