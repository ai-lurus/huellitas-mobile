import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from '../i18n/es.json';
import en from '../i18n/en.json';

export type AppLanguage = 'es' | 'en';

void i18n.use(initReactI18next).init({
  lng: 'es',
  fallbackLng: 'es',
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v3',
});

export default i18n;
