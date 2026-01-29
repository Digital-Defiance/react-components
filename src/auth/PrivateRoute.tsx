import { FC, ReactNode, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthProvider';
import { useI18n } from '../contexts';
import { SuiteCoreComponentId, SuiteCoreStringKey, SuiteCoreStringKeyValue } from '@digitaldefiance/suite-core-lib';

interface PrivateRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PrivateRoute: FC<PrivateRouteProps> = ({ children, redirectTo }) => {
  const { tComponent } = useI18n();
  const { isAuthenticated, isCheckingAuth } = useContext(AuthContext);
  const location = useLocation();

  if (isCheckingAuth) {
    return <div>{tComponent<SuiteCoreStringKeyValue>(SuiteCoreComponentId, SuiteCoreStringKey.Common_CheckingAuthentication)}...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo ?? "/login"} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
