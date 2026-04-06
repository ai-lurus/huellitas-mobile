import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import type { OnboardingPermissionStatus } from '../types/onboarding';

function mapStatus(status: Location.PermissionStatus): OnboardingPermissionStatus {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export interface UseLocationPermissionResult {
  status: OnboardingPermissionStatus;
  request: () => Promise<boolean>;
  refresh: () => Promise<void>;
  openSettings: () => void;
}

export function useLocationPermission(): UseLocationPermissionResult {
  const [status, setStatus] = useState<OnboardingPermissionStatus>('undetermined');

  const refresh = useCallback(async () => {
    const res = await Location.getForegroundPermissionsAsync();
    setStatus(mapStatus(res.status));
  }, []);

  const request = useCallback(async () => {
    const res = await Location.requestForegroundPermissionsAsync();
    const next = mapStatus(res.status);
    setStatus(next);
    return next === 'granted';
  }, []);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return { status, request, refresh, openSettings };
}
