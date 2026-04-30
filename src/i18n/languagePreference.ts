import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AppLanguage } from '../config/i18n';

const STORAGE_KEY_LANGUAGE = '@huellitas/lang';

export function parseLanguage(value: string | null | undefined): AppLanguage {
  const v = (value ?? '').toLowerCase().trim();
  return v === 'en' ? 'en' : 'es';
}

export async function loadLanguage(): Promise<AppLanguage> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
    return parseLanguage(raw);
  } catch {
    return 'es';
  }
}

export async function saveLanguage(language: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, language);
  } catch {
    // best-effort
  }
}

export { STORAGE_KEY_LANGUAGE };
