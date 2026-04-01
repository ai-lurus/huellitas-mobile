import { create } from 'zustand';
import { DEFAULT_ALERT_RADIUS_KM } from '../config/constants';

interface SettingsState {
  alertRadiusKm: number;
  alertsEnabled: boolean;
  setAlertRadius: (km: number) => void;
  setAlertsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  alertRadiusKm: DEFAULT_ALERT_RADIUS_KM,
  alertsEnabled: true,
  setAlertRadius: (km): void => set(() => ({ alertRadiusKm: km })),
  setAlertsEnabled: (enabled): void => set(() => ({ alertsEnabled: enabled })),
}));
