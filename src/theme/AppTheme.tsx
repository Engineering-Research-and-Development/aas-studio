import { useMemo, ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { inputsCustomizations } from '@/theme/customizations/inputs';
import { dataDisplayCustomizations } from '@/theme/customizations/dataDisplay';
import { feedbackCustomizations } from '@/theme/customizations/feedback';
import { navigationCustomizations } from '@/theme/customizations/navigation';
import { surfacesCustomizations } from '@/theme/customizations/surfaces';
import { colorSchemes, typography, shadows, shape } from '@/theme/themePrimitives';

interface AppThemeProps {
  children: ReactNode;
  disableCustomTheme?: boolean;
  themeComponents?: ThemeOptions['components'];
}

export default function AppTheme({ children, disableCustomTheme, themeComponents }: AppThemeProps) {
  const theme = useMemo(() => {
    return disableCustomTheme ? {} : createTheme({
      cssVariables: { colorSchemeSelector: 'data-mui-color-scheme', cssVarPrefix: 'template' },
      colorSchemes, typography, shadows, shape,
      components: { ...inputsCustomizations, ...dataDisplayCustomizations, ...feedbackCustomizations, ...navigationCustomizations, ...surfacesCustomizations, ...themeComponents },
    });
  }, [disableCustomTheme, themeComponents]);

  if (disableCustomTheme) return <>{children}</>;
  return <ThemeProvider theme={theme} disableTransitionOnChange>{children}</ThemeProvider>;
}
