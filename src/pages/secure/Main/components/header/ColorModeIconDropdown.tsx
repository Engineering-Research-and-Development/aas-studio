import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Menu, MenuItem, Tooltip } from '@mui/material';
import { DarkModeRounded, LightModeRounded } from '@mui/icons-material';
import { useColorScheme } from '@mui/material/styles';

import MenuButton from '@/pages/secure/Main/components/header/MenuButton';

export default function ColorModeIconDropdown() {
  const { mode, systemMode, setMode } = useColorScheme();
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleMode = (targetMode: 'system' | 'light' | 'dark') => () => {
    setMode(targetMode);
    handleMenuClose();
  };
  if (!mode) {
    return (
      <Box
        data-screenshot="toggle-mode"
        sx={(theme : any)  => ({
          verticalAlign: 'bottom',
          display: 'inline-flex',
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: (theme.vars || theme).shape.borderRadius,
          border: '1px solid',
          borderColor: (theme.vars || theme).palette.divider,
        })}
      />
    );
  }
  const resolvedMode = (systemMode || mode) as 'light' | 'dark';
  const icon = {
    light: <LightModeRounded />,
    dark: <DarkModeRounded />,
  }[resolvedMode];
  return (
    <>
      <Tooltip title={t('header.toolTips.theme')}> 
          <MenuButton onClick={handleMenuOpen}>
              {icon}
          </MenuButton>
      </Tooltip>
      <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
      >
        <MenuItem selected={mode === 'system'} onClick={handleMode('system')}>
        {t('header.colorMode.system')}
        </MenuItem>
        <MenuItem selected={mode === 'light'} onClick={handleMode('light')}>
        {t('header.colorMode.light')}
        </MenuItem>
        <MenuItem selected={mode === 'dark'} onClick={handleMode('dark')}>
        {t('header.colorMode.dark')}
        </MenuItem>
      </Menu>
    </>
  );
}
