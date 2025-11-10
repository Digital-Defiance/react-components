import { FC, ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, useI18n } from '../contexts';
import { SuiteCoreComponentId, SuiteCoreStringKey } from '@digitaldefiance/suite-core-lib';

export interface UnAuthRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const UnAuthRoute: FC<UnAuthRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, isCheckingAuth } = useContext(AuthContext);
  const { tComponent } = useI18n();
  const location = useLocation();

  if (isCheckingAuth) {
    return <div>{tComponent<SuiteCoreStringKey>(SuiteCoreComponentId, SuiteCoreStringKey.Common_CheckingAuthentication)}...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo ?? "/dashboard"} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
