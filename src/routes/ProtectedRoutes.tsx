import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';

interface ProtectedRouteProps { children: ReactNode; }

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { operator } = useSessionContext();
  if (!operator.auth_token) return <Navigate to="/" replace />;
  return <>{children}</>;
}
