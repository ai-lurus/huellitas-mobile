import { create } from 'zustand';

export interface OnboardingState {
  photo: string | null;
  locationGranted: boolean;
  notificationsGranted: boolean;
  setPhoto: (photo: string | null) => void;
  setLocationGranted: (granted: boolean) => void;
  setNotificationsGranted: (granted: boolean) => void;
  reset: () => void;
}

const initialState = {
  photo: null as string | null,
  locationGranted: false,
  notificationsGranted: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setPhoto: (photo): void => set(() => ({ photo })),
  setLocationGranted: (granted): void => set(() => ({ locationGranted: granted })),
  setNotificationsGranted: (granted): void => set(() => ({ notificationsGranted: granted })),
  reset: (): void => set(() => ({ ...initialState })),
}));
