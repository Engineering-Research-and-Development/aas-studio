import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Importa il hook di i18n

import { Button } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { CalendarTodayRounded } from '@mui/icons-material';

import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en'; 
import 'dayjs/locale/it'; 
import 'dayjs/locale/fr'; 
import 'dayjs/locale/es'; 
import 'dayjs/locale/nl'; 


function ButtonField(props: any) {
  const {
    setOpen,
    label,
    id,
    disabled,
    InputProps: { ref } = {},
    inputProps: { 'aria-label': ariaLabel } = {},
  } = props;

  return (
    <Button
      variant="outlined"
      id={id}
      disabled={disabled}
      ref={ref}
      aria-label={ariaLabel}
      size="small"
      onClick={() => setOpen?.((prev: any) => !prev)}
      startIcon={<CalendarTodayRounded fontSize="small" />}
      sx={{ minWidth: 'fit-content' }}
    >
      {label ? `${label}` : 'Pick a date'}
    </Button>
  );
}

interface CustomDatePickerProps {
  value: Dayjs | null;
  onChange: (newValue: Dayjs | null) => void;
}

export default function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const { i18n } = useTranslation(); // Ottieni la lingua attiva da i18n
  const [open, setOpen] = useState(false);
  const [formattedLabel, setFormattedLabel] = useState<string | null>(null);

  // Cambia la lingua di Day.js in base alla lingua attiva e aggiorna il label
  useEffect(() => {
    dayjs.locale(i18n.language); // Imposta la lingua attiva
    
    // Aggiorna il label formattato quando cambia la lingua
    if (value) {
      setFormattedLabel(value.locale(i18n.language).format('ddd, DD MMM YYYY'));
    }
  }, [i18n.language, value]);

  // Aggiorna il label quando cambia il valore
  useEffect(() => {
    if (value) {
      setFormattedLabel(value.locale(i18n.language).format('ddd, DD MMM YYYY'));
    } else {
      setFormattedLabel(null);
    }
  }, [value, i18n.language]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language}>
      <DatePicker
        value={value}
        label={formattedLabel}
        onChange={onChange}
        slots={{ field: ButtonField }}
        slotProps={{
          field: { setOpen } as any,
          nextIconButton: { size: 'small' },
          previousIconButton: { size: 'small' },
        }}
        open={open}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        views={['day']}
      />
    </LocalizationProvider>
  );
}