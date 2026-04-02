import Stack from '@mui/material/Stack';

import NavbarBreadcrumbs from '@/pages/secure/Main/components/header/NavbarBreadcrumbs';
import ColorModeIconDropdown from '@/pages/secure/Main/components/header/ColorModeIconDropdown';
import LanguageIconDropdown from '@/pages/secure/Main/components/header/LanguageIconDropdown';
import NotificationIconDropdown from '@/pages/secure/Main/components/header/NotificationIconDropdown';

export default function Header() {
  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <NavbarBreadcrumbs />
      <Stack direction="row" sx={{ gap: 1 }}>
        <LanguageIconDropdown />
        <ColorModeIconDropdown />
        <NotificationIconDropdown />
      </Stack>
    </Stack>
  );
}