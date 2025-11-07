import { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export interface PrivateRouteProps {
  children: ReactNode;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export const PrivateRoute: FC<PrivateRouteProps> = ({
  children,
  isAuthenticated,
  isCheckingAuth,
  redirectTo = '/login',
  loadingComponent = <div>Checking authentication...</div>,
}) => {
  const location = useLocation();

  if (isCheckingAuth) {
    return <>{loadingComponent}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
