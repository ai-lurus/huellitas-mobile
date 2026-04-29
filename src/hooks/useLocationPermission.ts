import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

import type { OnboardingPermissionStatus } from '../types/onboarding';

function mapStatus(status: Location.PermissionStatus): OnboardingPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export type BackgroundPermissionRequestResult = {
  granted: boolean;
  /** El usuario cerró el diálogo o pulsó «Ahora no» (no se llegó al permiso del sistema). */
  declinedExplanationDialog: boolean;
};

export interface UseLocationPermissionResult {
  /** Estado del permiso en primer plano (compatibilidad con onboarding). */
  status: OnboardingPermissionStatus;
  foregroundStatus: OnboardingPermissionStatus;
  backgroundStatus: OnboardingPermissionStatus;
  /** Solicita permiso en primer plano (alias de `requestForeground`). */
  request: () => Promise<boolean>;
  requestForeground: () => Promise<boolean>;
  /**
   * Muestra un diálogo explicativo y, si el usuario acepta, solicita permiso de ubicación en segundo plano.
   */
  requestBackgroundWithExplanation: () => Promise<BackgroundPermissionRequestResult>;
  refresh: () => Promise<void>;
  openSettings: () => void;
}

export function useLocationPermission(): UseLocationPermissionResult {
  const [foregroundStatus, setForegroundStatus] =
    useState<OnboardingPermissionStatus>('undetermined');
  const [backgroundStatus, setBackgroundStatus] =
    useState<OnboardingPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    const [fg, bg] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Location.getBackgroundPermissionsAsync(),
    ]);
    setForegroundStatus(mapStatus(fg.status));
    setBackgroundStatus(mapStatus(bg.status));
  }, []);

  const requestForeground = useCallback(async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    const next = mapStatus(res.status);
    setForegroundStatus(next);
    return next === 'granted';
  }, []);

  const requestBackgroundWithExplanation =
    useCallback((): Promise<BackgroundPermissionRequestResult> => {
      return new Promise((resolve) => {
        const finishDeclinedDialog = (): void =>
          resolve({ granted: false, declinedExplanationDialog: true });

        Alert.alert(
          'Ubicación en segundo plano',
          'Con tu permiso, podremos avisarte de alertas cercanas cuando la app no esté en primer plano. Puedes cambiarlo siempre en Ajustes.',
          [
            {
              text: 'Ahora no',
              style: 'cancel',
              onPress: finishDeclinedDialog,
            },
            {
              text: 'Continuar',
              onPress: (): void => {
                void (async (): Promise<void> => {
                  try {
                    const res = await Location.requestBackgroundPermissionsAsync();
                    const next = mapStatus(res.status);
                    setBackgroundStatus(next);
                    resolve({
                      granted: next === 'granted',
                      declinedExplanationDialog: false,
                    });
                  } catch {
                    setBackgroundStatus('denied');
                    resolve({ granted: false, declinedExplanationDialog: false });
                  }
                })();
              },
            },
          ],
          { cancelable: true, onDismiss: finishDeclinedDialog },
        );
      });
    }, []);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return {
    status: foregroundStatus,
    foregroundStatus,
    backgroundStatus,
    request: requestForeground,
    requestForeground,
    requestBackgroundWithExplanation,
    refresh,
    openSettings,
  };
}
