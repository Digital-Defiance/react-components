import { FC, ReactNode, useContext } from 'react';
import { AuthContext } from '../contexts/AuthProvider';

interface UnAuthProps {
  children: ReactNode;
}

const UnAuth: FC<UnAuthProps> = ({ children }) => {
  const { isAuthenticated, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth || isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default UnAuth;
