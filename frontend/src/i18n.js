import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    supportedLngs: ['en', 'ar'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

// Load translations
import enTranslation from '../public/locales/en/translation.json';
import arTranslation from '../public/locales/ar/translation.json';

i18n.addResourceBundle('en', 'translation', enTranslation);
i18n.addResourceBundle('ar', 'translation', arTranslation);

export default i18n;