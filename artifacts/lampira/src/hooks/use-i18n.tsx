import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = 'id' | 'en' | 'fr' | 'es' | 'pa' | 'de' | 'ar' | 'zh' | 'ja' | 'ko';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    'nav.home': 'Beranda',
    'nav.listings': 'Jelajah',
    'nav.bookings': 'Pesanan',
    'nav.dashboard': 'Dasbor',
    'nav.earnings': 'Pendapatan',
    'nav.profile': 'Profil',
    'auth.login': 'Masuk',
    'auth.register': 'Daftar',
    'auth.logout': 'Keluar',
    'home.hero': 'Jelajahi Lampung bersama Lampira',
    'home.hero_sub': 'Gerbang utama Anda menuju wisata Lampung. Temukan transportasi, akomodasi, dan petualangan tak terlupakan.',
    'search.placeholder': 'Cari destinasi, hotel, atau tur...',
    'search.button': 'Cari'
  },
  en: {
    'nav.home': 'Home',
    'nav.listings': 'Explore',
    'nav.bookings': 'Bookings',
    'nav.dashboard': 'Dashboard',
    'nav.earnings': 'Earnings',
    'nav.profile': 'Profile',
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'home.hero': 'Explore Lampung with Lampira',
    'home.hero_sub': 'Your ultimate gateway to Lampung tourism. Discover transportation, stays, and unforgettable adventures.',
    'search.placeholder': 'Search destinations, hotels, or tours...',
    'search.button': 'Search'
  },
  // Add simple fallbacks for other languages to English
  fr: { 'nav.home': 'Accueil' },
  es: { 'nav.home': 'Inicio' },
  pa: { 'nav.home': 'ਮੁੱਖ ਪੰਨਾ' },
  de: { 'nav.home': 'Startseite' },
  ar: { 'nav.home': 'الصفحة الرئيسية' },
  zh: { 'nav.home': '首页' },
  ja: { 'nav.home': 'ホーム' },
  ko: { 'nav.home': '홈' },
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    const stored = localStorage.getItem('lampira_lang') as Language;
    if (stored && Object.keys(translations).includes(stored)) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lampira_lang', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
