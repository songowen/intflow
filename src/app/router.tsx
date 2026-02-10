import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './Layout';
import AuthGuard from './AuthGuard';
import GuestGuard from './GuestGuard';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/pens/pages/DashboardPage';
import PenDetailPage from '../features/penDetail/pages/PenDetailPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        element: <GuestGuard />,
        children: [{ path: '/login', element: <LoginPage /> }],
      },
      {
        element: <AuthGuard />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/pens/:penId', element: <PenDetailPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

export default router;
