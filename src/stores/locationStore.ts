import { create } from 'zustand';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationState {
  currentLocation: Coordinates | null;
  lastSyncedLocation: Coordinates | null;
  setCurrentLocation: (coords: Coordinates) => void;
  setLastSyncedLocation: (coords: Coordinates) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  lastSyncedLocation: null,
  setCurrentLocation: (coords): void => set(() => ({ currentLocation: { ...coords } })),
  setLastSyncedLocation: (coords): void => set(() => ({ lastSyncedLocation: { ...coords } })),
}));
