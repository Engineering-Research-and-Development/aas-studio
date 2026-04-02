import { useState } from 'react';
import { Box, Typography, Chip, IconButton, Stepper, Step, StepLabel, Tooltip } from '@mui/material';
import { DeleteRounded, EmailRounded, TouchAppRounded, DescriptionRounded, HandshakeRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import Referral from '@/models/Referral';
import ConfirmDeleteReferralDialog from '@/pages/secure/Main/components/dialogs/ConfirmDeleteReferralDialog';

export const STATUS_STEPS: Referral['status'][] = ['invited', 'link_clicked', 'contacted', 'deal_closed'];

export const STATUS_META: Record<Referral['status'], { labelKey: string; icon: React.ReactNode; color: 'default' | 'warning' | 'info' | 'success' }> = {
  invited:      { labelKey: 'main.dialogs.referrals.status.invited',      icon: <EmailRounded sx={{ fontSize: '0.85rem' }} />,       color: 'default' },
  link_clicked: { labelKey: 'main.dialogs.referrals.status.link_clicked', icon: <TouchAppRounded sx={{ fontSize: '0.85rem' }} />,    color: 'warning' },
  contacted: { labelKey: 'main.dialogs.referrals.status.contacted', icon: <DescriptionRounded sx={{ fontSize: '0.85rem' }} />, color: 'info'    },
  deal_closed:  { labelKey: 'main.dialogs.referrals.status.deal_closed',  icon: <HandshakeRounded sx={{ fontSize: '0.85rem' }} />,   color: 'success' },
};

interface ReferralCardProps {
  referral: Referral;
  onDelete: (id: number) => void;
}

export default function ReferralCard({ referral, onDelete }: ReferralCardProps) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const activeStep = STATUS_STEPS.indexOf(referral.status);
  const meta = STATUS_META[referral.status];

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {referral.referee_email}
          </Typography>
          {referral.createdAt && (
            <Typography variant="caption" color="text.secondary">
              {new Date(referral.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Chip
            size="small"
            icon={meta.icon as React.ReactElement}
            label={t(meta.labelKey)}
            color={meta.color}
            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
          />
          <Tooltip title={t('main.dialogs.referrals.deleteReferral')}>
            <IconButton
              size="small"
              onClick={() => setConfirmOpen(true)}
              sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}
            >
              <DeleteRounded fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.6rem' } }}>
        {STATUS_STEPS.map((step) => (
          <Step key={step}>
            <StepLabel>{t(STATUS_META[step].labelKey)}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <ConfirmDeleteReferralDialog
        open={confirmOpen}
        email={referral.referee_email}
        onConfirm={() => { setConfirmOpen(false); onDelete(referral.referral_id); }}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  );
}
