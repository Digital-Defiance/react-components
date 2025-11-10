import { useEffect } from 'react';

export interface LogoutPageProps {
  onLogout: () => Promise<void> | void;
  onNavigate?: (path: string) => void;
  redirectTo?: string;
}

export const LogoutPage = ({ onLogout, onNavigate, redirectTo = '/login' }: LogoutPageProps) => {
  useEffect(() => {
    const performLogout = async () => {
      await onLogout();
      onNavigate?.(redirectTo);
    };
    performLogout();
  }, [onLogout, onNavigate, redirectTo]);

  return null;
};

export default LogoutPage;