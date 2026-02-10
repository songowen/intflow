import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../features/auth/auth';

// 이미 로그인 상태면 /dashboard로 리다이렉트
export default function GuestGuard() {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
