import { create } from 'zustand';

/** Coordenadas geográficas (WGS84) expuestas como `lat` / `lng`. */
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface LocationState {
  currentLocation: GeoCoordinates | null;
  lastSyncedLocation: GeoCoordinates | null;
  locationError: string | null;
  setLocation: (coords: GeoCoordinates) => void;
  setLastSyncedLocation: (coords: GeoCoordinates) => void;
  setLocationError: (message: string | null) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  lastSyncedLocation: null,
  locationError: null,
  setLocation: (coords): void => set(() => ({ currentLocation: { ...coords } })),
  setLastSyncedLocation: (coords): void => set(() => ({ lastSyncedLocation: { ...coords } })),
  setLocationError: (message): void => set(() => ({ locationError: message })),
  reset: (): void =>
    set(() => ({
      currentLocation: null,
      lastSyncedLocation: null,
      locationError: null,
    })),
}));
