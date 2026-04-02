import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grow,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { CheckCircleOutlineRounded, CloseRounded, ErrorOutlineRounded } from '@mui/icons-material';

import type { ValidationFinding, ValidationResult } from '@/context/AASContext';

interface ValidationDialogProps {
  open: boolean;
  onClose: () => void;
  res: ValidationResult | null;
}

type FindingGroup = {
  findings: ValidationFinding[];
  label: string;
  severity: 'error' | 'warning' | 'info';
};

export default function ValidationDialog({ open, onClose, res }: ValidationDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!res) return null;

  const { errors, warnings, infos, valid } = res;
  const total = errors.length + warnings.length + infos.length;

  const groups: FindingGroup[] = [
    { findings: errors, label: 'Errori', severity: 'error' },
    { findings: warnings, label: 'Warning', severity: 'warning' },
    { findings: infos, label: 'Info', severity: 'info' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      slots={{ transition: Grow }}
      slotProps={{ transition: { timeout: 300 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {valid ? (
          <CheckCircleOutlineRounded color="success" />
        ) : (
          <ErrorOutlineRounded color="error" />
        )}
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color={valid ? 'success.main' : 'error.main'}
            lineHeight={1.2}
          >
            {valid ? 'Validazione OK' : 'Validazione fallita'}
          </Typography>
          <Typography variant="caption" color="text.disabled" fontFamily="monospace">
            {total} finding{total !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box flexGrow={1} />
        <IconButton size="small" onClick={onClose}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {total === 0 ? (
          <Typography
            variant="body2"
            color="text.disabled"
            align="center"
            py={5}
          >
            AAS conforme allo standard.
          </Typography>
        ) : (
          groups.map(({ findings, label, severity }) =>
            findings.length > 0 && (
              <Box key={label} mb={2}>
                <Typography
                  variant="overline"
                  color={`${severity}.main`}
                  display="block"
                  mb={0.75}
                >
                  {label} ({findings.length})
                </Typography>
                {findings.map((f, i) => (
                  <Alert
                    key={i}
                    severity={severity}
                    variant="outlined"
                    sx={{ mb: 0.75, alignItems: 'flex-start' }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      {f.msg}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      fontFamily="monospace"
                      display="block"
                      mt={0.25}
                    >
                      {f.path} · {f.rule}
                    </Typography>
                  </Alert>
                ))}
              </Box>
            )
          )
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}
