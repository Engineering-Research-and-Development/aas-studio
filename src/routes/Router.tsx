import { Routes, Route } from 'react-router-dom';
import SignIn from '@/pages/public/SignIn/SignIn';
import ProtectedRoute from '@/routes/ProtectedRoutes';
import Main from '@/pages/secure/Main/Main';
import AASEditor from '@/pages/secure/AASEditor/AASEditor';
import AASLifecycle from '@/pages/secure/AASLifecycle/AASLifecycle';
import AASServer from '@/pages/secure/AASServer/AASServer';
import { AASProvider } from '@/context/AASContext';

const Router = () => (
  <Routes>
    <Route path="/" element={<SignIn />} />
    <Route
      path="editor"
      element={
        <ProtectedRoute>
          <AASProvider>
            <Main><AASEditor /></Main>
          </AASProvider>
        </ProtectedRoute>
      }
    />
    <Route
      path="lifecycle"
      element={
        <ProtectedRoute>
          <AASProvider>
            <Main><AASLifecycle /></Main>
          </AASProvider>
        </ProtectedRoute>
      }
    />
    <Route
      path="server"
      element={
        <ProtectedRoute>
          <AASProvider>
            <Main><AASServer /></Main>
          </AASProvider>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<SignIn />} />
  </Routes>
);

export default Router;
