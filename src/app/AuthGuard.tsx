import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../features/auth/auth';

export default function AuthGuard() {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
}
