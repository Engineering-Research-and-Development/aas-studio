import { ReactNode } from 'react';
import { SnackbarProvider, useSnackbar, SnackbarKey } from 'notistack';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type VariantType = 'default' | 'success' | 'warning' | 'error' | 'info';

function CloseSnackbarButton({ id }: { id: SnackbarKey }) {
  const { closeSnackbar } = useSnackbar();
  return (
    <IconButton
      size="small"
      sx={{ backgroundColor: 'inherit', color: 'inherit', border: 'none', boxShadow: 'none', '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' } }}
      onClick={() => closeSnackbar(id)}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
}

type CustomSnackbarProviderProps = { children: ReactNode; closable?: boolean; autoHideDuration?: number | null };

export const CustomSnackbarProvider = ({ children, closable = true, autoHideDuration }: CustomSnackbarProviderProps) => (
  <SnackbarProvider
    maxSnack={5}
    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    action={closable ? (key => <CloseSnackbarButton id={key} />) : undefined}
    autoHideDuration={closable ? undefined : autoHideDuration ?? null}
  >
    {children}
  </SnackbarProvider>
);

export function useCustomSnackbar() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  return {
    showSnackbar: (msg: string, variant: VariantType) => enqueueSnackbar(msg, { variant }),
    dismissSnackbar: closeSnackbar,
  };
}
