import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

export default function RoleRoute({ allowedRoles }) {
  const { user } = useAuthStore();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
