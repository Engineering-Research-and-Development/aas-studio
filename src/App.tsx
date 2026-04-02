import { BrowserRouter } from 'react-router-dom';
import { SessionProvider } from '@/context/SessionContext';
import { CustomSnackbarProvider } from '@/context/SnackbarContext';
import { OperatorPreferencesProvider } from '@/context/OperatorPreferencesContext';

import Router from '@/routes/Router';
import '@/i18n/config';

const App = () => {
  return (
    <SessionProvider>
      <OperatorPreferencesProvider>
        <CustomSnackbarProvider>
            <BrowserRouter>
                <Router />
            </BrowserRouter>
        </CustomSnackbarProvider>
      </OperatorPreferencesProvider>
    </SessionProvider>
  );
};

export default App;
