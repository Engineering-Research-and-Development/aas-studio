import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Avatar, Button, Divider, Stack, Typography } from '@mui/material';
import { drawerClasses, default as Drawer } from '@mui/material/Drawer';
import { LogoutRounded, ManageAccountsRounded, PersonRounded } from '@mui/icons-material';

import MenuContent from '@/pages/secure/Main/components/sideMenu/MenuContent';
import NotificationIconDropdown from '@/pages/secure/Main/components/header/NotificationIconDropdown';

import { useSessionContext } from '@/context/SessionContext';

interface SideMenuMobileProps {
  open: boolean | undefined;
  toggleDrawer: () => void;
}

export default function SideMenuMobile({ open, toggleDrawer }: SideMenuMobileProps) {
  const { t } = useTranslation();
  const { operator, setOperator } = useSessionContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!operator.auth_token) {
      navigate('/', { replace: true });
    }
  }, [operator.auth_token, navigate]);

  const redirectToProfile = () => {
    toggleDrawer();
    navigate('/profile', { replace: true });
  };

  const terminateSession = () => {
    setOperator(null);
  };

  const handleMenuItemClick = () => {
    toggleDrawer();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={toggleDrawer}
      sx={{
        zIndex: (theme: any) => theme.zIndex.drawer + 1,
        [`& .${drawerClasses.paper}`]: {
          backgroundImage: 'none',
          bgcolor: 'background.paper',
        },
      }}
    >
      <Stack
        sx={{
          maxWidth: '70dvw',
          height: '100%',
        }}
      >
        <Stack direction="row" sx={{ p: 2, pb: 0, gap: 1 }}>
          <Stack
            direction="row"
            sx={{ gap: 1, alignItems: 'center', flexGrow: 1, p: 1 }}
          >
            <Avatar
              sizes="small"
              alt={operator.name || 'User'}
              src={operator.picture || '/profile.png'}
              sx={{ width: 36, height: 36 }}
            >
              <PersonRounded />
            </Avatar>
            <Typography component="p" variant="h6">
              {operator.name} {operator.surname}
            </Typography>
          </Stack>
          <NotificationIconDropdown />
        </Stack>
        <Divider />
        <Stack sx={{ flexGrow: 1 }}>
          <MenuContent collapsed={false} onItemClick={handleMenuItemClick} />
          <Divider />
        </Stack>
        <Stack sx={{ p: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={redirectToProfile}
            startIcon={<ManageAccountsRounded />}>
            {t('common.texts.profile')}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={terminateSession}
            startIcon={<LogoutRounded sx={{ color: 'error.main' }} />}>
            {t('common.texts.logout')}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}