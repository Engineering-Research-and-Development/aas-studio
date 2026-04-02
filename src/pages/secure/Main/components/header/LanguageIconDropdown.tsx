import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; 

import { Menu, MenuItem, IconButtonOwnProps, ListItemIcon, ListItemText, Tooltip } from '@mui/material';
import { TranslateRounded } from '@mui/icons-material';

import Flag from 'react-world-flags';

import MenuButton from '@/pages/secure/Main/components/header/MenuButton';

export default function ColorModeIconDropdown(_: IconButtonOwnProps) {
    const { t, i18n } = useTranslation(); 
    
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        const savedLanguage = sessionStorage.getItem('selectedLanguage');
        if (savedLanguage && savedLanguage !== i18n.language) {
            i18n.changeLanguage(savedLanguage);
        }
    }, [i18n]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget); 
    };

    const handleMenuClose = () => {
        setAnchorEl(null); 
    };

    const handleLanguageChange = (language: string) => {
        i18n.changeLanguage(language);
        // Salva la lingua scelta nel sessionStorage
        sessionStorage.setItem('selectedLanguage', language);
        handleMenuClose(); 
    };

    return (
        <>
            <Tooltip title={t('header.toolTips.translation')}> 
                <MenuButton onClick={handleMenuOpen}>
                    <TranslateRounded />
                </MenuButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleLanguageChange('en')}>
                    <ListItemIcon>
                        <Flag code="GB" style={{ width: 20, height: 15 }} />
                    </ListItemIcon>
                    <ListItemText primary="English" />
                </MenuItem>
                <MenuItem onClick={() => handleLanguageChange('it')}>
                    <ListItemIcon>
                        <Flag code="IT" style={{ width: 20, height: 15 }} />
                    </ListItemIcon>
                    <ListItemText primary="Italiano" />
                </MenuItem>
                {/* <MenuItem onClick={() => handleLanguageChange('fr')}>
                    <ListItemIcon>
                        <Flag code="FR" style={{ width: 20, height: 15 }} />
                    </ListItemIcon>
                    <ListItemText primary="Français" />
                </MenuItem>
                <MenuItem onClick={() => handleLanguageChange('es')}>
                    <ListItemIcon>
                        <Flag code="ES" style={{ width: 20, height: 15 }} />
                    </ListItemIcon>
                    <ListItemText primary="Español" />
                </MenuItem>
                <MenuItem onClick={() => handleLanguageChange('nl')}>
                    <ListItemIcon>
                        <Flag code="NL" style={{ width: 20, height: 15 }} />
                    </ListItemIcon>
                    <ListItemText primary="Dutch" />
                </MenuItem> */}
            </Menu>
        </>
    );
}
