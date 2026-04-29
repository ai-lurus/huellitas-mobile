import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import {
  STORAGE_KEY_PUSH_LAST_EXPO_TOKEN,
  STORAGE_KEY_PUSH_PERMISSION_PROMPTED,
} from '../config/constants';
import { pushNotificationDataSchema } from '../domain/pushNotifications';
import { notificationsService } from '../services/notificationsService';
import { useAuthStore } from '../stores/authStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

function resolveEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return (
    extra?.eas?.projectId ?? (Constants.easConfig as { projectId?: string } | undefined)?.projectId
  );
}

function navigateToReportIfValid(data: unknown): void {
  const parsed = pushNotificationDataSchema.safeParse(data);
  if (!parsed.success) return;
  if (!useAuthStore.getState().isAuthenticated) return;
  router.push(`/(app)/reports/${parsed.data.reportId}`);
}

async function syncExpoPushToken(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const projectId = resolveEasProjectId();
  let expoToken: Notifications.ExpoPushToken;
  try {
    expoToken = await Notifications.getExpoPushTokenAsync(
      projectId != null && projectId.length > 0 ? { projectId } : undefined,
    );
  } catch {
    return;
  }

  const token = expoToken.data;
  const last = await AsyncStorage.getItem(STORAGE_KEY_PUSH_LAST_EXPO_TOKEN);
  if (last === token) return;

  try {
    await notificationsService.registerPushToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
    });
    await AsyncStorage.setItem(STORAGE_KEY_PUSH_LAST_EXPO_TOKEN, token);
  } catch {
    // Error de red o backend; el próximo resume (AppState) reintentará si el token cambió.
  }
}

/**
 * Permisos, registro del token Expo en backend, listeners de apertura y banner en primer plano.
 * Debe montarse en el layout raíz cuando exista sesión (vía `user`).
 */
export function useNotifications(): void {
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!userId) return;

    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const title = notification.request.content.title;
      const body = notification.request.content.body;
      Toast.show({
        type: 'info',
        text1: title != null && title.length > 0 ? title : 'Huellitas',
        text2: body ?? undefined,
        visibilityTime: 4500,
      });
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      navigateToReportIfValid(response.notification.request.content.data);
    });

    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void syncExpoPushToken();
      }
    });

    void (async (): Promise<void> => {
      const prompted = await AsyncStorage.getItem(STORAGE_KEY_PUSH_PERMISSION_PROMPTED);
      if (!prompted) {
        await Notifications.requestPermissionsAsync();
        await AsyncStorage.setItem(STORAGE_KEY_PUSH_PERMISSION_PROMPTED, '1');
      }
      await syncExpoPushToken();
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last?.notification) {
        navigateToReportIfValid(last.notification.request.content.data);
      }
    })();

    return (): void => {
      foregroundSub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, [userId]);
}
