import { create } from 'zustand';
import { DEFAULT_ALERT_RADIUS_KM } from '../config/constants';

export interface SettingsState {
  alertRadiusKm: number;
  taskRemindersEnabled: boolean;
  radarAlertsEnabled: boolean;
  serviceUpdatesEnabled: boolean;
  plakaNewsEnabled: boolean;
  setAlertRadius: (km: number) => void;
  setTaskRemindersEnabled: (enabled: boolean) => void;
  setRadarAlertsEnabled: (enabled: boolean) => void;
  setServiceUpdatesEnabled: (enabled: boolean) => void;
  setPlakaNewsEnabled: (enabled: boolean) => void;
  hydrateFromProfile: (profile: {
    alertRadiusKm?: number | null;
    taskRemindersEnabled?: boolean | null;
    radarAlertsEnabled?: boolean | null;
    serviceUpdatesEnabled?: boolean | null;
    plakaNewsEnabled?: boolean | null;
  }) => void;
  reset: () => void;
}

function clampRadiusKm(km: number): number {
  if (!Number.isFinite(km)) return DEFAULT_ALERT_RADIUS_KM;
  if (km < 1) return 1;
  if (km > 10) return 10;
  return Math.round(km);
}

export const useSettingsStore = create<SettingsState>((set) => ({
  alertRadiusKm: DEFAULT_ALERT_RADIUS_KM,
  taskRemindersEnabled: true,
  radarAlertsEnabled: true,
  serviceUpdatesEnabled: true,
  plakaNewsEnabled: false,
  setAlertRadius: (km): void => set(() => ({ alertRadiusKm: clampRadiusKm(km) })),
  setTaskRemindersEnabled: (enabled): void => set(() => ({ taskRemindersEnabled: enabled })),
  setRadarAlertsEnabled: (enabled): void => set(() => ({ radarAlertsEnabled: enabled })),
  setServiceUpdatesEnabled: (enabled): void => set(() => ({ serviceUpdatesEnabled: enabled })),
  setPlakaNewsEnabled: (enabled): void => set(() => ({ plakaNewsEnabled: enabled })),
  hydrateFromProfile: (profile): void =>
    set(() => ({
      alertRadiusKm:
        profile.alertRadiusKm == null
          ? DEFAULT_ALERT_RADIUS_KM
          : clampRadiusKm(profile.alertRadiusKm),
      taskRemindersEnabled:
        profile.taskRemindersEnabled == null ? true : Boolean(profile.taskRemindersEnabled),
      radarAlertsEnabled:
        profile.radarAlertsEnabled == null ? true : Boolean(profile.radarAlertsEnabled),
      serviceUpdatesEnabled:
        profile.serviceUpdatesEnabled == null ? true : Boolean(profile.serviceUpdatesEnabled),
      plakaNewsEnabled:
        profile.plakaNewsEnabled == null ? false : Boolean(profile.plakaNewsEnabled),
    })),
  reset: (): void =>
    set(() => ({
      alertRadiusKm: DEFAULT_ALERT_RADIUS_KM,
      taskRemindersEnabled: true,
      radarAlertsEnabled: true,
      serviceUpdatesEnabled: true,
      plakaNewsEnabled: false,
    })),
}));
