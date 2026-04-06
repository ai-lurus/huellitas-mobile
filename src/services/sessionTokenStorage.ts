import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SESSION_TOKEN_KEY = 'huellitas_session_token';

const WEB_STORAGE_KEY = SESSION_TOKEN_KEY;

function getWebStorage(): Storage | null {
  if (typeof globalThis === 'undefined') return null;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export async function getSessionTokenAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(WEB_STORAGE_KEY) ?? null;
  }
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionTokenAsync(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(WEB_STORAGE_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function deleteSessionTokenAsync(): Promise<void> {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(WEB_STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
}
