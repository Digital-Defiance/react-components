import { FC, ReactNode, useContext } from 'react';
import { AuthContext } from '../contexts/AuthProvider';

export interface UnAuthProps {
  children: ReactNode;
}

export const UnAuth: FC<UnAuthProps> = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};