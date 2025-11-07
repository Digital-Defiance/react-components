import { FC, ReactNode } from 'react';

export interface PrivateProps {
  children: ReactNode;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
}

export const Private: FC<PrivateProps> = ({
  children,
  isAuthenticated,
  isCheckingAuth,
}) => {
  if (isCheckingAuth || !isAuthenticated) {
    return <></>;
  }

  return <>{children}</>;
};
