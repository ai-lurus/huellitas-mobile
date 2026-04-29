import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY_PUSH_LAST_EXPO_TOKEN } from '../config/constants';
import { httpClient } from '../network';

const PUSH_TOKEN_PATH = '/api/v1/users/me/push-token';

export interface RegisterPushTokenPayload {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

async function registerPushToken(payload: RegisterPushTokenPayload): Promise<void> {
  await httpClient.post(PUSH_TOKEN_PATH, payload);
}

async function deletePushToken(): Promise<void> {
  await httpClient.delete(PUSH_TOKEN_PATH);
}

/** Borra el token Expo guardado localmente (p. ej. tras logout). */
async function clearStoredExpoPushToken(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_PUSH_LAST_EXPO_TOKEN);
}

export const notificationsService = {
  registerPushToken,
  deletePushToken,
  clearStoredExpoPushToken,
};
