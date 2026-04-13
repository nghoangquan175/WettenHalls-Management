import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRolePrefix, type UserRole } from '../constants/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requirePermission?: string;
}

export const AuthGuard = ({ children, allowedRoles, requirePermission }: AuthGuardProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRolePrefix(user.role) || '/login'} replace />;
  }

  if (requirePermission && user.role !== 'SUPER_ADMIN' && !user.permissions?.includes(requirePermission)) {
    return <Navigate to={getRolePrefix(user.role) || '/login'} replace />;
  }

  return <>{children}</>;
};
