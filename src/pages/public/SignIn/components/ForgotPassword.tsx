import { useState } from 'react';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormHelperText, Grow, IconButton, OutlinedInput, useMediaQuery, useTheme } from '@mui/material';
import { CloseRounded, MedicalServicesRounded } from '@mui/icons-material';

import { useApiWrapper } from '@/api/apiWrapper';
import { useCustomSnackbar } from '@/context/SnackbarContext';

interface ForgotPasswordProps {
  open: boolean;
  onSubmit: (data: { email: string; token: string; password: string }) => void;
  onClose: () => void;
}

export default function ForgotPassword({ open, onSubmit, onClose }: ForgotPasswordProps) {
  const { post } = useApiWrapper();
  const { showSnackbar } = useCustomSnackbar();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [step, setStep] = useState<'email' | 'recovery'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    // Reset dello stato quando si chiude il dialog
    setStep('email');
    setEmail('');
    setToken('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsLoading(false);
    onClose();
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (step === 'email') {
      // Validazione email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        errs.email = 'Email is required';
      } else if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address';
      }
    } else {
      // Validazione token
      const tokenRegex = /^[a-zA-Z0-9]{10}$/;
      if (!token.trim()) {
        errs.token = 'Token is required';
      } else if (!tokenRegex.test(token.trim())) {
        errs.token = 'Token must be exactly 10 alphanumeric characters';
      }

      // Validazione password
      const passwordRegex = /^[a-zA-Z0-9_?!@#$%^&]*$/;
      const hasNumberOrSpecial = /[0-9_?!@#$%^&]/.test(password);

      if (!password.trim()) {
        errs.password = 'Password is required';
      } else if (!passwordRegex.test(password.trim())) {
        errs.password = 'Password can only contain letters, numbers and special characters: _?!@#$%^&';
      } else if (!hasNumberOrSpecial) {
        errs.password = 'Password must contain at least one number or special character';
      }

      // Validazione conferma password
      if (!confirmPassword.trim()) {
        errs.confirmPassword = 'Password confirmation is required';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleStep = async () => {
    if (!validate()) {
      return;
    }

    if (step === 'email') {
      setIsLoading(true);
      try {
        const response = await post('/v1/forget', {
          email: email
        });
        if (response.statusCode == 200) {
          // Passa al secondo step
          showSnackbar('Recovery email sent successfully', 'success');
          setStep('recovery');
          setErrors({}); // Reset errori quando si passa al secondo step
        } else {
          // Mostra un messaggio di errore
          console.error(response.data.message);
          showSnackbar(response.data.message || 'An error occurred', 'error');
        }
      } catch (error: any) {
        // Gestione degli errori
        console.error(error.response?.data?.message || 'An error occurred');
        showSnackbar(error.response?.data?.message || 'An error occurred', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Invia i dati per il recupero
      onSubmit({
        email,
        token,
        password
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_: any, reason: string) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      maxWidth="xs"
      slots={{
        transition: Grow,
      }}
      slotProps={{
        transition: {
          timeout: 300,
        },
      }}
    >
      <DialogTitle
        id="alert-dialog-title"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Box display="flex" alignItems="center">
          <MedicalServicesRounded sx={{ mr: 1 }} />
          Recover your account
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{
            justifyContent: 'center',
            border: 'none'
          }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {step === 'email' ? (
          <>
            <DialogContentText>
              Enter your account&apos;s email address, and we&apos;ll send you a token to
              reset your password.
            </DialogContentText>
            <Box>
              <OutlinedInput
                autoFocus
                required
                margin="dense"
                id="email"
                name="email"
                placeholder="Email address"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
              />
              {errors.email && (
                <FormHelperText error sx={{ ml: 0 }}>
                  {errors.email}
                </FormHelperText>
              )}
            </Box>
          </>
        ) : (
          <>
            <DialogContentText>
              Enter the token you received via email and your new password.
            </DialogContentText>
            <OutlinedInput
              disabled
              margin="dense"
              id="email-disabled"
              name="email"
              placeholder="Email address"
              type="email"
              fullWidth
              value={email}
              sx={{ mb: 2 }}
            />
            <Box sx={{ mb: 2 }}>
              <OutlinedInput
                autoFocus
                required
                margin="dense"
                id="token"
                name="token"
                placeholder="Recovery token"
                type="text"
                fullWidth
                value={token}
                onChange={(e) => setToken(e.target.value)}
                error={!!errors.token}
              />
              {errors.token && (
                <FormHelperText error sx={{ ml: 0 }}>
                  {errors.token}
                </FormHelperText>
              )}
            </Box>
            <Box sx={{ mb: 2 }}>
              <OutlinedInput
                required
                margin="dense"
                id="password"
                name="password"
                placeholder="New password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
              />
              {errors.password && (
                <FormHelperText error sx={{ ml: 0 }}>
                  {errors.password}
                </FormHelperText>
              )}
            </Box>
            <Box>
              <OutlinedInput
                required
                margin="dense"
                id="confirm-password"
                name="confirmPassword"
                placeholder="Confirm new password"
                type="password"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <FormHelperText error sx={{ ml: 0 }}>
                  {errors.confirmPassword}
                </FormHelperText>
              )}
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={fullScreen ? { flexDirection: 'column', gap: 1 } : undefined}>
        <Button
          onClick={handleClose}
          fullWidth={fullScreen}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleStep}
          fullWidth={fullScreen}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {isLoading ? 'Loading...' : (step === 'email' ? 'Continue' : 'Recover')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
