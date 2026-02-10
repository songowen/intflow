import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './ko.json';
import en from './en.json';

const LANG_KEY = 'lang';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  // 저장된 언어가 없으면 ko 기본
  lng: localStorage.getItem(LANG_KEY) || 'ko',
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

// 언어 변경 시 localStorage 동기화
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng);
});

export default i18n;
