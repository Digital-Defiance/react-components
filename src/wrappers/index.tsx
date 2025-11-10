import { FC, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SecureString, EmailString } from '@digitaldefiance/ecies-lib';
import { BackupCodeLoginForm } from '../components/BackupCodeLoginForm';
import { BackupCodesForm } from '../components/BackupCodesForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { LoginForm, LoginFormValues } from '../components/LoginForm';
import { RegisterForm, RegisterFormValues } from '../components/RegisterForm';
import { LogoutPage } from '../components/LogoutPage';
import { VerifyEmailPage } from '../components/VerifyEmailPage';
import { useAuth } from '../contexts';
import { createAuthenticatedApiClient } from '../services';

export const BackupCodeLoginWrapper: FC = () => {
  const { backupCodeLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  return (
    <BackupCodeLoginForm 
      onSubmit={backupCodeLogin}
      onNavigate={navigate}
      isAuthenticated={isAuthenticated}
    />
  );
};

export interface BackupCodesWrapperProps {
  baseUrl: string;
}

export const BackupCodesWrapper: FC<BackupCodesWrapperProps> = ({ baseUrl }) => {
  const [backupCodesRemaining, setBackupCodesRemaining] = useState<number | null>(
    (useLocation().state as { codeCount?: number })?.codeCount ?? null
  );
  const requestedOnMountRef = useRef(false);
  const api = createAuthenticatedApiClient(baseUrl);

  useEffect(() => {
    if (requestedOnMountRef.current) return;
    if (backupCodesRemaining !== null) return;

    requestedOnMountRef.current = true;

    api.get('/user/backup-codes')
      .then((result: any) => {
        if (result?.data?.codeCount) {
          setBackupCodesRemaining(result.data.codeCount);
        }
      })
      .catch(() => {
        setBackupCodesRemaining(0);
      });
  }, [backupCodesRemaining, api]);

  const handleSubmit = async (values: { password?: string; mnemonic?: string }) => {
    const result = await api.post('/user/backup-codes', {
      ...(values.password ? { password: values.password } : {}),
      ...(values.mnemonic ? { mnemonic: values.mnemonic } : {}),
    });
    return {
      message: result.data.message,
      backupCodes: result.data.backupCodes,
    };
  };
  
  return <BackupCodesForm onSubmit={handleSubmit} backupCodesRemaining={backupCodesRemaining} />;
};

export const ChangePasswordFormWrapper: FC = () => {
  const { changePassword } = useAuth();

  const handleSubmit = async (values: any) => {
    const result = await changePassword(
      values.currentPassword,
      values.newPassword
    );
    if ('error' in result) {
      throw new Error(result.error);
    }
    return result;
  };

  return <ChangePasswordForm onSubmit={handleSubmit} />;
};

export const LoginFormWrapper: FC = () => {
  const { directLogin, passwordLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    if (values.password) {
      const result = await passwordLogin(
        new SecureString(values.password),
        values.username,
        values.email ? new EmailString(values.email) : undefined
      );
      if ('error' in result) {
        throw new Error(result.error);
      }
      navigate('/dashboard');
    } else if (values.mnemonic) {
      const result = await directLogin(
        new SecureString(values.mnemonic),
        values.username,
        values.email ? new EmailString(values.email) : undefined
      );
      if ('error' in result) {
        throw new Error(result.error);
      }
      navigate('/dashboard');
    }
  };

  return <LoginForm onSubmit={handleSubmit} />;
};

export const RegisterFormWrapper: FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

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
    navigate('/verify-email');
    return result;
  };

  return (
    <RegisterForm 
      onSubmit={handleSubmit}
      timezones={['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London']}
      getInitialTimezone={() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
    />
  );
};

export const LogoutPageWrapper: FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  return <LogoutPage onLogout={logout} onNavigate={navigate} />;
};

export interface VerifyEmailPageWrapperProps {
  baseUrl: string;
}

export const VerifyEmailPageWrapper: FC<VerifyEmailPageWrapperProps> = ({ baseUrl }) => {
  const api = createAuthenticatedApiClient(baseUrl);
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  const handleVerify = async (verificationToken: string) => {
    try {
      const result = await api.post('/verify-email', { token: verificationToken });
      return { success: true, message: result.data.message };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  return <VerifyEmailPage token={token} onVerify={handleVerify} />;
};
