import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Breadcrumbs, breadcrumbsClasses, Typography }  from '@mui/material';
import { NavigateNextRounded } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme } : { theme: any }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation(); 

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRounded fontSize="small" />}
    >
      <Typography variant="body1">Main</Typography>
      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {t(`sideMenu.menuContent.${location.pathname.split('/')[1]}`)}
      </Typography>
    </StyledBreadcrumbs>
  );
}
