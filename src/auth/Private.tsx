import { FC, ReactNode, useContext } from 'react';
import { AuthContext } from '../contexts/AuthProvider';
export interface PrivateProps {
  children: ReactNode;
}

export const Private: FC<PrivateProps> = ({
  children,
}) => {
  const { isAuthenticated, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth || !isAuthenticated) {
    return <></>;
  }

  return <>{children}</>;
};
