import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import { DeleteRounded, NotificationsRounded } from '@mui/icons-material';

import MenuButton from '@/pages/secure/Main/components/header/MenuButton';

import { useNotificationContext } from '@/context/NotificationContext';
import { formatReceivedAt } from '@/utils/utils';

export default function NotificationIconDropdown() {
  const { notifications, showBadge, hideBadge, clearNotifications } = useNotificationContext();
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    hideBadge();
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  }
  return (
    <>
      <Tooltip title={t('header.toolTips.notifications')}>
        <MenuButton showBadge={showBadge} onClick={handleMenuOpen}>
          <NotificationsRounded />
        </MenuButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        slotProps={{
          paper: {
            variant: 'outlined',
            elevation: 0,
            sx: {
              my: '4px',
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification: { message_id: string; title: string; body: string; received_at: string }) => (
            <MenuItem 
              key={notification.message_id} 
              onClick={handleMenuClose}
              sx={{
                minWidth: '250px',
              }}>
              <div>
                <Typography variant="subtitle2" fontWeight="bold">
                  {notification.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'normal',
                    wordWrap: 'break-word',
                    maxWidth: '300px'
                  }}
                >
                  {notification.body}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatReceivedAt(notification.received_at)}
                </Typography>
              </div>
            </MenuItem>
          ))
        ) : (
          <MenuItem key="none" onClick={handleMenuClose}>
            <div>
              <Typography variant="subtitle2">
                {t("header.notifications.empty")}
              </Typography>
            </div>
          </MenuItem>
        )}
        {notifications.length > 0 && (
        <Button
          color="error"
          variant="contained"
          fullWidth
          onClick={clearNotifications}
          startIcon={<DeleteRounded/>}>
          {t('common.buttons.deleteAll')}
        </Button>
      )}
      </Menu>
    </>
  );
}
