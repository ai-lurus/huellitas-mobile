import { z } from 'zod';

import type { LostReport } from '../domain/lostReports';
import { lostReportSchema } from '../domain/lostReports';
import { petSpeciesSchema } from '../domain/pets';
import { httpClient } from '../network';
import { distanceMeters } from '../utils/geo';

export interface NearbyLostReportsParams {
  lat: number;
  lng: number;
  radius: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function pickCoordinates(record: Record<string, unknown>): { lat: number; lng: number } | null {
  const location =
    asRecord(record.location) ?? asRecord(record.coords) ?? asRecord(record.coordinate);
  const lat =
    asNumber(record.lat) ??
    asNumber(record.latitude) ??
    asNumber(location?.lat) ??
    asNumber(location?.latitude);
  const lng =
    asNumber(record.lng) ??
    asNumber(record.longitude) ??
    asNumber(location?.lng) ??
    asNumber(location?.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

function pickPhotoUrl(pet: Record<string, unknown>): string | undefined {
  const direct =
    asString(pet.photoUrl) ??
    asString(pet.imageUrl) ??
    asString(pet.coverPhotoUrl) ??
    asString(pet.coverImageUrl);
  if (direct) return direct;
  const photos = Array.isArray(pet.photos) ? pet.photos : [];
  for (const item of photos) {
    if (typeof item === 'string' && item.trim().length > 0) return item.trim();
    const obj = asRecord(item);
    const url = asString(obj?.url) ?? asString(obj?.uri);
    if (url) return url;
  }
  return undefined;
}

function normalizeLostReport(raw: unknown, params: NearbyLostReportsParams): LostReport | null {
  const record = asRecord(raw);
  if (!record) return null;
  const pet = asRecord(record.pet) ?? record;
  const coords = pickCoordinates(record);
  if (!coords) return null;

  const speciesRaw =
    asString(pet.species) ?? asString(record.petSpecies) ?? asString(record.species) ?? 'other';
  const species = petSpeciesSchema.safeParse(speciesRaw.toLowerCase());
  const createdAt =
    asString(record.createdAt) ??
    asString(record.reportedAt) ??
    asString(record.created_at) ??
    new Date().toISOString();

  const parsed = lostReportSchema.safeParse({
    id: asString(record.id) ?? asString(record.reportId),
    lat: coords.lat,
    lng: coords.lng,
    petName: asString(pet.name) ?? asString(record.petName) ?? 'Mascota',
    petBreed: asString(pet.breed) ?? asString(record.petBreed) ?? null,
    petSpecies: species.success ? species.data : 'other',
    petPhotoUrl: pickPhotoUrl(pet) ?? null,
    distanceMeters:
      asNumber(record.distanceMeters) ??
      asNumber(record.distance) ??
      distanceMeters({ lat: params.lat, lng: params.lng }, coords),
    createdAt,
  });
  return parsed.success ? parsed.data : null;
}

async function getNearby(params: NearbyLostReportsParams): Promise<LostReport[]> {
  const response = await httpClient.get<unknown>('/api/v1/lost-reports/nearby', {
    params: {
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
    },
  });

  const body = response.data;
  const list =
    (Array.isArray(body) ? body : null) ??
    (asRecord(body) && Array.isArray(body.data) ? body.data : null) ??
    (asRecord(body) && Array.isArray(body.items) ? body.items : null) ??
    (asRecord(body) && Array.isArray(body.reports) ? body.reports : null) ??
    [];

  return z
    .array(z.unknown())
    .parse(list)
    .map((item) => normalizeLostReport(item, params))
    .filter((item): item is LostReport => item !== null);
}

export const reportsService = {
  getNearby,
};
