import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { SecureString, EmailString } from '@digitaldefiance/ecies-lib';
import { LoginForm, LoginFormValues, LoginFormProps } from '../components/LoginForm';
import { useAuth, useSuiteConfig } from '../contexts';
import { SuiteCoreStringKey, TranslatableSuiteError } from '@digitaldefiance/suite-core-lib';

export interface LoginFormWrapperProps {
  onSuccess?: () => void;
  redirectTo?: string;
  componentProps?: Partial<Omit<LoginFormProps, 'onSubmit'>>;
}

export const LoginFormWrapper: FC<LoginFormWrapperProps> = ({ 
  onSuccess,
  redirectTo,
  componentProps = {},
}) => {
  const { directLogin, passwordLogin } = useAuth();
  const navigate = useNavigate();
  const { routes } = useSuiteConfig();

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
      if (onSuccess) {
        onSuccess();
      }
      navigate(redirectTo || routes.dashboard || '/dashboard');
    } else if (values.mnemonic) {
      const result = await directLogin(
        new SecureString(values.mnemonic),
        username,
        email
      );
      if ('error' in result) {
        throw new Error(result.error);
      }
      if (onSuccess) {
        onSuccess();
      }
      navigate(redirectTo || routes.dashboard || '/dashboard');
    } else {
      throw new TranslatableSuiteError(SuiteCoreStringKey.Error_NoPasswordOrMnemonicProvided);
    }
  };

  return <LoginForm onSubmit={handleSubmit} {...componentProps} />;
};
