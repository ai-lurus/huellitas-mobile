import { useCallback, useEffect, useState } from 'react';

import i18n, { type AppLanguage } from '../config/i18n';
import { loadLanguage, saveLanguage } from './languagePreference';

export interface UseAppLanguageResult {
  language: AppLanguage;
  setLanguage: (lng: AppLanguage) => Promise<void>;
  isLoading: boolean;
}

export function useAppLanguage(): UseAppLanguageResult {
  const [language, setLanguageState] = useState<AppLanguage>('es');
  const [isLoading, setIsLoading] = useState(true);

  useEffect((): void | (() => void) => {
    let cancelled = false;
    void loadLanguage().then((lng) => {
      if (cancelled) return;
      setLanguageState(lng);
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback(async (lng: AppLanguage) => {
    setLanguageState(lng);
    await saveLanguage(lng);
    await i18n.changeLanguage(lng);
  }, []);

  return { language, setLanguage, isLoading };
}
