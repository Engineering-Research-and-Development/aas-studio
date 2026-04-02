import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { FormControl, InputAdornment, OutlinedInput, IconButton } from '@mui/material';
import { SearchRounded, ClearRounded } from '@mui/icons-material';

interface SearchbarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function Searchbar({ value = '', onChange, placeholder }: SearchbarProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(value);

  // Aggiorna lo stato locale quando cambia il valore dall'esterno
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    if (onChange) {
      onChange('');
    }
  };

  return (
    <FormControl sx={{ width: '100%' }} variant="outlined">
      <OutlinedInput
        size="small"
        id="search"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder || t('searchbar.placeholder')}
        sx={{ 
          flexGrow: 1
       }}
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.primary' }}>
            <SearchRounded fontSize="small" />
          </InputAdornment>
        }
        endAdornment={
          inputValue ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleClear}
                edge="end"
                aria-label="clear search"
              >
                <ClearRounded fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </FormControl>
  );
}
