import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import it_translation from './it/translation.json';
import en_translation from './en/translation.json';

i18next.use(initReactI18next).init({
  lng: 'it',
  fallbackLng: 'en',
  debug: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
  saveMissing: false,
  resources: {
    it: { translation: it_translation },
    en: { translation: en_translation },
  },
});
