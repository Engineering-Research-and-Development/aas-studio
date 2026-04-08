import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSessionContext } from '@/context/SessionContext';
import Main from '@/pages/secure/Main/Main';

interface ProtectedRouteProps { children: ReactNode; }

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { operator } = useSessionContext();
  if (!operator.auth_token) return <Navigate to="/" replace />;
  return (
    <Main>{children}</Main>
  );
}
