import * as Location from 'expo-location';
import { useCallback, useRef } from 'react';

import { usersService } from '../services/usersService';
import { useLocationStore } from '../stores/locationStore';
import { distanceMeters } from '../utils/geo';

/** Intervalo mínimo entre envíos al backend tras superar el umbral de distancia. */
export const LOCATION_SYNC_DEBOUNCE_MS = 30_000;

const WATCH_DISTANCE_INTERVAL_M = 100;
const MIN_DISTANCE_SYNC_M = 100;

export interface UseLocationResult {
  startWatching: () => Promise<void>;
  stopWatching: () => void;
}

export function useLocation(): UseLocationResult {
  const setLocation = useLocationStore((s) => s.setLocation);
  const setLastSyncedLocation = useLocationStore((s) => s.setLastSyncedLocation);
  const setLocationError = useLocationStore((s) => s.setLocationError);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback((): void => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const scheduleBackendSync = useCallback(
    (lat: number, lng: number): void => {
      clearDebounce();
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void usersService
          .patchMyLocation({ lat, lng })
          .then(() => {
            setLastSyncedLocation({ lat, lng });
            useLocationStore.getState().setLocationError(null);
          })
          .catch(() => {
            useLocationStore
              .getState()
              .setLocationError('No se pudo actualizar la ubicación en el servidor.');
          });
      }, LOCATION_SYNC_DEBOUNCE_MS);
    },
    [clearDebounce, setLastSyncedLocation],
  );

  const stopWatching = useCallback((): void => {
    clearDebounce();
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, [clearDebounce]);

  const startWatching = useCallback(async (): Promise<void> => {
    if (subscriptionRef.current != null) return;

    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') return;
    if (subscriptionRef.current != null) return;

    let providerOk = true;
    try {
      const providers = await Location.getProviderStatusAsync();
      providerOk = providers.locationServicesEnabled;
      if (!providerOk) {
        setLocationError('Activa el GPS o los servicios de ubicación en el dispositivo.');
        return;
      }
    } catch {
      providerOk = true;
    }

    if (subscriptionRef.current != null) return;

    if (providerOk) {
      setLocationError(null);
    }

    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30_000,
          distanceInterval: WATCH_DISTANCE_INTERVAL_M,
        },
        (loc) => {
          const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setLocation(coords);
          setLocationError(null);

          const last = useLocationStore.getState().lastSyncedLocation;
          if (last == null || distanceMeters(last, coords) >= MIN_DISTANCE_SYNC_M) {
            scheduleBackendSync(coords.lat, coords.lng);
          }
        },
        (message) => {
          setLocationError(message.length > 0 ? message : 'No se pudo obtener la ubicación.');
        },
      );
    } catch {
      setLocationError('No se pudo iniciar el seguimiento de ubicación.');
    }
  }, [scheduleBackendSync, setLocation, setLocationError]);

  return { startWatching, stopWatching };
}
