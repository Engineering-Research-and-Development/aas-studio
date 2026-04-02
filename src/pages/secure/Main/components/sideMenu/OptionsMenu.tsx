import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { styled, Box, Avatar, Menu, Stack, Typography, ListItemText, ListItemIcon, MenuItem as MuiMenuItem } from '@mui/material';
import { LogoutRounded, ManageAccountsRounded, MoreVertRounded } from '@mui/icons-material';

import MenuButton from '@/pages/secure/Main/components/header/MenuButton';

import { useSessionContext } from '@/context/SessionContext';
import { useSessionHook } from '@/hooks/useSessionHook';

const MenuItem = styled(MuiMenuItem)({
  margin: '2px 0',
});

export default function OptionsMenu({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const { operator } = useSessionContext();
  const { logout } = useSessionHook();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    if (!operator.auth_token) {
      navigate('/', { replace: true });
    }
  }, [operator.auth_token, navigate]);
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const redirectToProfile = () => {
    handleClose();
    navigate('/profile', { replace: true });
  };

  const terminateSession = async () => {
    handleClose();
    await logout();
  };

  return (
    <Stack direction="row" alignItems="center" justifyContent={'center'}
      sx={{
        p: 2,
        gap: 1,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
      <Avatar
        alt={operator.society?.name || 'User'} src={operator.society?.picture || '/static/images/avatar/default.png'}
        sx={{
          width: 36,
          height: 36,
          cursor: collapsed ? 'pointer' : 'default'
        }}
        onClick={collapsed ? handleClick : function () { }}
      />
      {!collapsed && (
        <Box sx={{ mr: 'auto', maxWidth: '150px', overflow: 'hidden' }}>
          <Typography
            variant="body2"
            fontWeight={500}
            lineHeight="16px"
            sx={{
              whiteSpace: 'nowrap', // Impedisce il capo
              overflow: 'hidden', // Nasconde il testo in eccesso
              textOverflow: 'ellipsis', // Mostra i puntini di sospensione
            }}
          >
            {operator.user.name} {operator.user.surname}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              whiteSpace: 'nowrap', // Impedisce il capo
              overflow: 'hidden', // Nasconde il testo in eccesso
              textOverflow: 'ellipsis', // Mostra i puntini di sospensione
            }}
          >
            {operator.user.email}
          </Typography>
        </Box>
      )}

      {!collapsed && (
        <MenuButton
          aria-label="Open menu"
          onClick={handleClick}
          sx={{ border: 'none' }}
        >
          <MoreVertRounded />
        </MenuButton>
      )}

      <Menu
        anchorEl={anchorEl}
        id="menu"
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 140,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider',
              mt: 0.5
            }
          }
        }}
      >
        <MenuItem
          onClick={redirectToProfile}
          sx={{
            py: 1,
            '&:hover': {
              bgcolor: 'primary.50'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <ManageAccountsRounded
              fontSize="small"
              sx={{ color: 'text.primary' }}
            />
          </ListItemIcon>
          <ListItemText
            primary={t('common.texts.profile')}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={terminateSession}
          sx={{
            py: 1,
            '&:hover': {
              bgcolor: 'primary.50'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutRounded
              fontSize="small"
              sx={{ color: 'error.main' }}
            />
          </ListItemIcon>
          <ListItemText
            primary={t('common.texts.logout')}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: 500
            }}
          />
        </MenuItem>
      </Menu>
    </Stack>
  );
}
