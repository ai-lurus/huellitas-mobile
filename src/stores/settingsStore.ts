import { create } from 'zustand';
import { DEFAULT_ALERT_RADIUS_KM } from '../config/constants';

export interface SettingsState {
  alertRadiusKm: number;
  alertsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  emailAlertsEnabled: boolean;
  setAlertRadius: (km: number) => void;
  setAlertsEnabled: (enabled: boolean) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setEmailAlertsEnabled: (enabled: boolean) => void;
  hydrateFromProfile: (profile: {
    alertRadiusKm?: number | null;
    alertsEnabled?: boolean | null;
    pushNotificationsEnabled?: boolean | null;
    emailAlertsEnabled?: boolean | null;
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
  alertsEnabled: true,
  pushNotificationsEnabled: true,
  emailAlertsEnabled: false,
  setAlertRadius: (km): void => set(() => ({ alertRadiusKm: clampRadiusKm(km) })),
  setAlertsEnabled: (enabled): void => set(() => ({ alertsEnabled: enabled })),
  setPushNotificationsEnabled: (enabled): void =>
    set(() => ({ pushNotificationsEnabled: enabled })),
  setEmailAlertsEnabled: (enabled): void => set(() => ({ emailAlertsEnabled: enabled })),
  hydrateFromProfile: (profile): void =>
    set(() => ({
      alertRadiusKm:
        profile.alertRadiusKm == null
          ? DEFAULT_ALERT_RADIUS_KM
          : clampRadiusKm(profile.alertRadiusKm),
      alertsEnabled: profile.alertsEnabled == null ? true : Boolean(profile.alertsEnabled),
      pushNotificationsEnabled:
        profile.pushNotificationsEnabled == null ? true : Boolean(profile.pushNotificationsEnabled),
      emailAlertsEnabled:
        profile.emailAlertsEnabled == null ? false : Boolean(profile.emailAlertsEnabled),
    })),
  reset: (): void =>
    set(() => ({
      alertRadiusKm: DEFAULT_ALERT_RADIUS_KM,
      alertsEnabled: true,
      pushNotificationsEnabled: true,
      emailAlertsEnabled: false,
    })),
}));
