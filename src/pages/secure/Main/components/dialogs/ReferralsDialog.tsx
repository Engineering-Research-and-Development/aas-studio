import { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Grow, Box, Typography, Divider, Avatar, useTheme, useMediaQuery, Grid, TextField, Chip, Tooltip } from '@mui/material';
import { CloseRounded, StarRounded, CheckCircleRounded, GroupAddRounded, CardGiftcardRounded, InfoOutlined, SendRounded } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

import { useReferralHook } from '@/hooks/useReferralHook';
import ReferralCard from '@/pages/secure/Main/components/cards/ReferralCard';
import ReferralSkeleton from '@/pages/secure/Main/components/skeletons/ReferralSkeleton';

interface ReferralsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ReferralsDialog({ open, onClose }: ReferralsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { referrals, isLoadingReferrals, isSendingInvite, fetchReferrals, sendReferralInvite, deleteReferral } = useReferralHook();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (open) fetchReferrals();
  }, [open]);

  if (!open) return null;

  const maxReferrals = 3;
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      setEmailError(t('main.dialogs.referrals.emailInvalid'));
      return;
    }
    setEmailError('');
    const ok = await sendReferralInvite(email);
    if (ok) {
        await fetchReferrals();
        setEmail('');
    }
  };

  const closedCount = referrals.filter(r => r.status === 'deal_closed').length;

  const steps = [
    { icon: <GroupAddRounded />,   title: t('main.dialogs.referrals.step1Title'), desc: t('main.dialogs.referrals.step1Desc') },
    { icon: <StarRounded />,       title: t('main.dialogs.referrals.step2Title'), desc: t('main.dialogs.referrals.step2Desc') },
    { icon: <CardGiftcardRounded />, title: t('main.dialogs.referrals.step3Title'), desc: t('main.dialogs.referrals.step3Desc') },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={fullScreen}
      slots={{ transition: Grow }}
      slotProps={{ transition: { timeout: 300 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <StarRounded sx={{ color: 'warning.main' }} />
          <Typography variant="h6" fontWeight={700}>
            {t('main.dialogs.referrals.title')}
          </Typography>
          {closedCount > 0 && (
            <Chip
              size="small"
              label={`${closedCount}/${maxReferrals} ${t('main.dialogs.referrals.closed')}`}
              color="success"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ border: 'none' }}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Grid container sx={{ minHeight: 480 }}>

          {/* ── LEFT COLUMN ── */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              p: 3,
              borderRight: { md: '1px solid' },
              borderColor: { md: 'divider' },
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: 'auto',
            }}
          >
            {/* Banner */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ff980022 0%, #ffd54f22 100%)',
                border: '1px solid',
                borderColor: 'warning.light',
                borderRadius: 3,
                p: 2.5,
                textAlign: 'center',
              }}
            >
              <StarRounded sx={{ fontSize: 40, color: 'warning.main', mb: 0.5 }} />
              <Typography variant="h6" fontWeight={800} gutterBottom>
                {t('main.dialogs.referrals.heroTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('main.dialogs.referrals.heroDesc')}
              </Typography>
            </Box>

            {/* Steps */}
            <Typography variant="subtitle2" fontWeight={700}>
              {t('main.dialogs.referrals.howItWorksTitle')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {steps.map((step, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 34, height: 34, flexShrink: 0, '& .MuiSvgIcon-root': { fontSize: '1rem' } }}>
                    {step.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>{step.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{step.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Divider />

            {/* Conditions */}
            <Typography variant="subtitle2" fontWeight={700}>
              {t('main.dialogs.referrals.conditionsTitle')}
            </Typography>
            {[
              t('main.dialogs.referrals.condition1'),
              t('main.dialogs.referrals.condition2'),
              t('main.dialogs.referrals.condition3'),
            ].map((cond, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <CheckCircleRounded sx={{ color: 'success.main', fontSize: '1rem', mt: 0.3, flexShrink: 0 }} />
                <Typography variant="body2">{cond}</Typography>
              </Box>
            ))}

            {/* Note */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', mt: 'auto' }}>
              <InfoOutlined sx={{ color: 'info.main', fontSize: '1rem', mt: 0.2, flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">
                {t('main.dialogs.referrals.note')}
              </Typography>
            </Box>
          </Grid>

          {/* ── RIGHT COLUMN ── */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              {t('main.dialogs.referrals.inviteTitle')}
            </Typography>

            {/* Email invite */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                fullWidth
                type="email"
                placeholder={t('main.dialogs.referrals.emailPlaceholder')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                error={!!emailError}
                helperText={emailError}
                disabled={isSendingInvite || referrals.length >= maxReferrals}
              />
              <Tooltip title={referrals.length >= maxReferrals ? t('main.dialogs.referrals.maxReached') : ''}>
                <span>
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={isSendingInvite || !email.trim() || referrals.length >= maxReferrals}
                    endIcon={<SendRounded />}
                    sx={{ whiteSpace: 'nowrap', height: 40 }}
                  >
                    {t('main.dialogs.referrals.sendBtn')}
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <Divider />

            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              {t('main.dialogs.referrals.myReferrals')} ({referrals.length}/{maxReferrals})
            </Typography>

            {/* Referral cards */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, overflowY: 'auto', flex: 1 }}>
              {isLoadingReferrals ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <ReferralSkeleton key={i} />
                ))
              ) : referrals.length === 0 ? (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    py: 6,
                    color: 'text.secondary',
                  }}
                >
                  <GroupAddRounded sx={{ fontSize: 48, opacity: 0.3 }} />
                  <Typography variant="body2">{t('main.dialogs.referrals.noReferrals')}</Typography>
                </Box>
              ) : (
                referrals.map((r) => <ReferralCard key={r.referral_id} referral={r} onDelete={deleteReferral} />)
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {t('common.buttons.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
