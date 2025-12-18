import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackupCodeLoginForm } from '../components/BackupCodeLoginForm';
import { useAuth } from '../contexts';

export interface BackupCodeLoginWrapperProps {
  onSuccess?: () => void;
  componentProps?: Partial<React.ComponentProps<typeof BackupCodeLoginForm>>;
}

export const BackupCodeLoginWrapper: FC<BackupCodeLoginWrapperProps> = ({
  onSuccess,
  componentProps = {},
}) => {
  const { backupCodeLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit: typeof backupCodeLogin = async (...args) => {
    const result = await backupCodeLogin(...args);
    if ('token' in result && onSuccess) {
      onSuccess();
    }
    return result;
  };

  return (
    <BackupCodeLoginForm
      onSubmit={handleSubmit}
      onNavigate={navigate}
      isAuthenticated={isAuthenticated}
      {...componentProps}
    />
  );
};
