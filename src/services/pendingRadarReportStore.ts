import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY_PENDING_RADAR_REPORT } from '../config/constants';

export interface PendingLostReportDraft {
  kind: 'lost';
  petId: string;
  createdAt: string;
  payload: {
    lat: number;
    lng: number;
    lastSeenAt: string;
    message: string;
  };
}

export interface PendingStrayReportDraft {
  kind: 'stray';
  createdAt: string;
  payload: {
    species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
    lat: number;
    lng: number;
    seenAt: string;
    color?: string;
    description: string;
    photoUris: string[];
  };
}

export type PendingRadarReportDraft = PendingLostReportDraft | PendingStrayReportDraft;

export async function savePendingRadarReport(draft: PendingRadarReportDraft): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_PENDING_RADAR_REPORT, JSON.stringify(draft));
}

export async function loadPendingRadarReport(): Promise<PendingRadarReportDraft | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY_PENDING_RADAR_REPORT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingRadarReportDraft;
  } catch {
    return null;
  }
}

export async function clearPendingRadarReport(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY_PENDING_RADAR_REPORT);
}
