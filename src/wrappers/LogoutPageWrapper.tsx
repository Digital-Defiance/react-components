import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutPage } from '../components/LogoutPage';
import { useAuth, useSuiteConfig } from '../contexts';

export interface LogoutPageWrapperProps {
  onSuccess?: () => void;
  redirectTo?: string;
  componentProps?: Partial<React.ComponentProps<typeof LogoutPage>>;
}

export const LogoutPageWrapper: FC<LogoutPageWrapperProps> = ({ 
  onSuccess,
  redirectTo,
  componentProps = {},
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { routes } = useSuiteConfig();
  
  const handleLogout = async () => {
    await logout();
    if (onSuccess) {
      onSuccess();
    }
    navigate(redirectTo || routes.login || '/login');
  };
  
  return <LogoutPage onLogout={handleLogout} onNavigate={navigate} {...componentProps} />;
};
