import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { alpha } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

import NavbarMobile from '@/pages/secure/Main/components/header/NavbarMobile';
import Header from '@/pages/secure/Main/components/header/Header';
import SideMenu from '@/pages/secure/Main/components/sideMenu/SideMenu';

import { DialogProvider } from '@/context/DialogContext';

import type { } from '@mui/x-date-pickers/themeAugmentation';
import type { } from '@mui/x-charts/themeAugmentation';
import type { } from '@mui/x-tree-view/themeAugmentation';

import AppTheme from '@/theme/AppTheme';
import { chartsCustomizations, dataGridCustomizations, datePickersCustomizations, treeViewCustomizations } from '@/pages/secure/Main/theme/customizations';

import { isMobile } from '@/utils/utils';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

interface MainProps {
  children: ReactNode;
}

const Main = ({ children }: MainProps) => {
  const location = useLocation();

  // Controlla se siamo nella pagina calendar
  const isCalendarPage = location.pathname === '/calendar';

  return (
    <DialogProvider>
      <AppTheme themeComponents={xThemeComponents}>
        <CssBaseline enableColorScheme />
        <Box
          sx={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden', // Evita overflow orizzontale
            width: '100%', // Assicura che il layout occupi tutta la larghezza disponibile
          }}
        >
          {/* SideMenu */}
          <SideMenu />
          <NavbarMobile />
          {/* Contenuto principale */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Evita overflow orizzontale
              width: '100%', // Assicura che il contenuto si adatti alla larghezza disponibile
              backgroundColor: (theme: any) =>
                theme.vars
                  ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                  : alpha(theme.palette.background.default, 1),
            }}
          >
            {/* Header fisso */}
            <Box
              sx={(theme: any) => ({
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: (theme: any) =>
                  theme.vars
                    ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                    : alpha(theme.palette.background.default, 1),
                width: '100%', // Assicura che l'header occupi tutta la larghezza
                padding: '16px',
                [theme.breakpoints.down('md')]: {
                  pt: '64px', // Padding specifico per tablet
                },
                boxSizing: 'border-box', // Assicura che il padding non causi overflow
              })}
            >
              <Header />
            </Box>

            {/* Contenuto scrollabile */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: isCalendarPage && !isMobile() ? 'hidden' : 'auto', // Disabilita scroll per calendar
                overflowX: 'hidden', // Evita lo scroll orizzontale
                px: 2,
                pb: 2,
                boxSizing: 'border-box', // Assicura che il padding non causi overflow
              }}
            >
              {children}
            </Box>
          </Box>
        </Box>
      </AppTheme>
    </DialogProvider>
  );
};

export default Main;