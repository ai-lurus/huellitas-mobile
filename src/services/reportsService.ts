import { z } from 'zod';

import type { LostReport, MyLostReportSummary } from '../domain/lostReports';
import { lostReportSchema, myLostReportSummarySchema } from '../domain/lostReports';
import type { LostReportDetail, LostReportSighting } from '../domain/lostReportDetail';
import { lostReportDetailSchema, lostReportSightingSchema } from '../domain/lostReportDetail';
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
    asString(pet.petPhotoUrl) ??
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

function guessImageMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function extractPhotoUrls(record: Record<string, unknown>): string[] {
  const out: string[] = [];

  const push = (u: string | undefined): void => {
    if (u == null) return;
    const trimmed = u.trim();
    if (!trimmed) return;
    if (!out.includes(trimmed)) out.push(trimmed);
  };

  const candidates: unknown[] = [
    record['photos'],
    record['images'],
    record['photoUrls'],
    record['gallery'],
    record['media'],
    record['attachments'],
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    for (const item of candidate) {
      if (typeof item === 'string') push(item);
      else if (typeof item === 'object' && item != null) {
        const r = item as Record<string, unknown>;
        push(
          asString(r['url']) ??
            asString(r['uri']) ??
            asString(r['imageUrl']) ??
            asString(r['photoUrl']),
        );
      }
    }
  }

  for (const k of [
    'photo',
    'photoUrl',
    'imageUrl',
    'coverPhotoUrl',
    'coverImageUrl',
    'avatarUrl',
  ]) {
    push(asString(record[k]));
  }

  return out.slice(0, 25);
}

function normalizeUserSummary(
  raw: unknown,
): { id: string; name: string; imageUrl?: string } | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = asString(record.id) ?? asString(record.userId) ?? asString(record.ownerId);
  const name = asString(record.name) ?? asString(record.fullName) ?? asString(record.username);
  if (!id || !name) return null;

  return {
    id,
    name,
    imageUrl: asString(record.imageUrl) ?? asString(record.image) ?? asString(record.avatarUrl),
  };
}

function normalizeSighting(raw: unknown): LostReportSighting | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = asString(record.id) ?? asString(record.sightingId);
  const createdAt =
    asString(record.createdAt) ??
    asString(record.created_at) ??
    asString(record.timestamp) ??
    asString(record.seenAt);
  if (!id || !createdAt) return null;

  const userRaw =
    record.user ?? record.author ?? record.reportedBy ?? record.by ?? record.reporter ?? record;
  let user = normalizeUserSummary(userRaw) ?? null;

  if (!user) {
    const reporterRec = asRecord(record.reporter ?? record.user);
    const uid = asString(reporterRec?.id) ?? asString(reporterRec?.userId);
    if (uid) user = { id: uid, name: 'Usuario' };
  }

  if (!user) return null;

  const nestedCoordsRecord = asRecord(record.location ?? record.coords ?? record.coordinate);
  const coords =
    pickCoordinates(record) ?? (nestedCoordsRecord ? pickCoordinates(nestedCoordsRecord) : null);
  if (!coords) return null;

  const notes =
    asString(record.notes) ??
    asString(record.note) ??
    asString(record.description) ??
    asString(record.message);
  const photoUrls = extractPhotoUrls(record);

  const parsed = lostReportSightingSchema.safeParse({
    id,
    createdAt,
    user: {
      id: user.id,
      name: user.name,
      imageUrl: user.imageUrl,
    },
    location: coords,
    notes,
    photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
  });

  return parsed.success ? parsed.data : null;
}

function toMetersFromPossibleRadiusKm(radius: number): number {
  // Heurística: si está entre 1..80, asumimos km.
  if (radius >= 1 && radius <= 80) return radius * 1000;
  return radius;
}

function normalizeLostReportDetailBase(raw: unknown): Omit<LostReportDetail, 'sightings'> | null {
  const record = asRecord(raw);
  if (!record) return null;

  const pet = asRecord(record.pet) ?? asRecord(record.petInfo) ?? record;

  const speciesRaw =
    asString(pet.species) ?? asString(record.petSpecies) ?? asString(record.species) ?? 'other';
  const species = petSpeciesSchema.safeParse(speciesRaw.toLowerCase());

  const petName =
    asString(pet.name) ?? asString(record.petName) ?? asString(record.name) ?? 'Mascota';
  const petBreed = asString(pet.breed) ?? asString(record.petBreed) ?? null;
  const petPhotoUrl = pickPhotoUrl(pet);

  const nestedCoordsRecord = asRecord(record.location ?? record.coords ?? record.coordinate);
  const lossLocation =
    pickCoordinates(record) ?? (nestedCoordsRecord ? pickCoordinates(nestedCoordsRecord) : null);
  if (!lossLocation) return null;

  const radiusKm =
    asNumber(record.lossRadiusKm) ??
    asNumber(record.radiusKm) ??
    asNumber(record.searchRadiusKm) ??
    asNumber(record.searchRadius);
  const radiusMeters =
    asNumber(record.lossRadiusMeters) ?? asNumber(record.radiusMeters) ?? asNumber(record.radius);

  const lossRadiusMeters =
    radiusMeters && radiusMeters > 0
      ? radiusMeters
      : radiusKm && radiusKm > 0
        ? toMetersFromPossibleRadiusKm(radiusKm)
        : undefined;

  const ownerId =
    asString(record.ownerId) ?? asString(record.reportedBy) ?? asString(record.userId);
  const resolvedAt = asString(record.resolvedAt) ?? asString(record.resolved_at);
  const createdAt =
    asString(record.createdAt) ??
    asString(record.reportedAt) ??
    asString(record.created_at) ??
    undefined;
  const lastSeenAt = asString(record.lastSeenAt) ?? asString(record.last_seen_at) ?? undefined;
  const message =
    asString(record.message) ??
    asString(record.description) ??
    asString(record.details) ??
    asString(record.notes) ??
    null;

  const parsed = lostReportDetailSchema.safeParse({
    id: asString(record.id) ?? asString(record.reportId),
    ownerId,
    petName,
    petSpecies: species.success ? species.data : 'other',
    petBreed,
    petPhotoUrl: petPhotoUrl ?? null,
    createdAt,
    lastSeenAt,
    message,
    lossLocation,
    lossRadiusMeters,
    resolvedAt: resolvedAt ?? null,
    sightings: [],
  });

  return parsed.success ? { ...parsed.data } : null;
}

function normalizeSightingsList(raw: unknown): LostReportSighting[] {
  const record = asRecord(raw);
  const list =
    (Array.isArray(raw) ? raw : null) ??
    (record && Array.isArray(record.data) ? record.data : null) ??
    (record && Array.isArray(record.items) ? record.items : null) ??
    (record && Array.isArray(record.sightings) ? record.sightings : null) ??
    [];

  const parsed = z.array(z.unknown()).safeParse(list);
  if (!parsed.success) return [];

  return parsed.data
    .map((item) => normalizeSighting(item))
    .filter((s): s is LostReportSighting => s != null);
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

  const kindRaw =
    asString(record.reportKind) ??
    asString(record.kind) ??
    asString(record.reportType) ??
    asString(record.status);
  const lower = kindRaw?.toLowerCase() ?? '';
  const resolvedAt = asString(record.resolvedAt) ?? asString(record.resolved_at);
  const isResolved =
    resolvedAt != null ||
    lower === 'resolved' ||
    lower === 'found' ||
    lower === 'encontrado' ||
    lower === 'resuelto';

  const reportKind = isResolved
    ? ('resolved' as const)
    : lower === 'sighted' ||
        lower === 'seen' ||
        lower === 'visto' ||
        lower === 'avistado' ||
        lower === 'spotting'
      ? ('sighted' as const)
      : ('lost' as const);

  const parsed = lostReportSchema.safeParse({
    id: asString(record.id) ?? asString(record.reportId),
    userId: asString(record.userId) ?? asString(record.user_id) ?? asString(record.ownerId),
    lat: coords.lat,
    lng: coords.lng,
    petName: asString(pet.name) ?? asString(record.petName) ?? 'Mascota',
    petBreed: asString(pet.breed) ?? asString(record.petBreed) ?? null,
    petSpecies: species.success ? species.data : 'other',
    petPhotoUrl: pickPhotoUrl(pet) ?? null,
    description:
      asString(record.message) ??
      asString(record.description) ??
      asString(record.details) ??
      asString(record.notes) ??
      undefined,
    locationLabel:
      asString(record.locationLabel) ??
      asString(record.location) ??
      asString(record.address) ??
      asString(record.city) ??
      undefined,
    distanceMeters:
      asNumber(record.distanceMeters) ??
      asNumber(record.distance) ??
      distanceMeters({ lat: params.lat, lng: params.lng }, coords),
    createdAt,
    reportKind,
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
  const bodyRec = asRecord(body);
  const list =
    (Array.isArray(body) ? body : null) ??
    (bodyRec && Array.isArray(bodyRec.data) ? bodyRec.data : null) ??
    (bodyRec && Array.isArray(bodyRec.items) ? bodyRec.items : null) ??
    (bodyRec && Array.isArray(bodyRec.reports) ? bodyRec.reports : null) ??
    [];

  return z
    .array(z.unknown())
    .parse(list)
    .map((item) => normalizeLostReport(item, params))
    .filter((item): item is LostReport => item !== null);
}

export interface CreateLostReportDto {
  lat: number;
  lng: number;
  /** ISO 8601 */
  lastSeenAt: string;
  message?: string | null;
}

export interface CreateLostReportResult {
  id: string;
  notifiedUsersCount?: number;
  searchRadiusKm?: number;
}

export interface CreateLostReportSightingDto {
  lat: number;
  lng: number;
  notes?: string | null;
  /** URIs locales (file:// / content://) que el servicio convertirá a `multipart/form-data`. */
  photoUris?: string[];
}

export interface CreateLostReportSightingResult {
  notifiedUsersCount?: number;
  searchRadiusKm?: number;
}

export interface ResolveLostReportResult {
  resolvedAt?: string;
  notifiedUsersCount?: number;
  sightingsCount?: number;
  totalMinutes?: number;
}

function pickIdFromRecord(record: Record<string, unknown> | null): string | undefined {
  if (!record) return undefined;
  return asString(record.id) ?? asString(record.reportId);
}

function normalizeCreateLostReportResponse(data: unknown): CreateLostReportResult {
  const root = asRecord(data);
  if (!root) {
    throw new Error('Respuesta inválida al crear reporte');
  }
  const nested = asRecord(root.data) ?? asRecord(root.report) ?? root;
  const id = pickIdFromRecord(nested) ?? pickIdFromRecord(root);
  if (!id) {
    throw new Error('Respuesta inválida al crear reporte');
  }
  const notified =
    asNumber(root.notifiedUsersCount) ??
    asNumber(root.notifiedCount) ??
    asNumber(nested.notifiedUsersCount);
  const searchRadiusKm =
    asNumber(root.searchRadiusKm) ?? asNumber(nested.searchRadiusKm) ?? asNumber(root.radiusKm);
  return {
    id,
    notifiedUsersCount: notified,
    searchRadiusKm,
  };
}

async function createLostReport(
  petId: string,
  dto: CreateLostReportDto,
): Promise<CreateLostReportResult> {
  const response = await httpClient.post<unknown>('/api/v1/lost-reports', {
    petId,
    lat: dto.lat,
    lng: dto.lng,
    lastSeenAt: dto.lastSeenAt,
    ...(dto.message != null && String(dto.message).trim().length > 0
      ? { message: dto.message.trim() }
      : {}),
  });
  return normalizeCreateLostReportResponse(response.data);
}

async function getLostReportDetail(reportId: string): Promise<LostReportDetail> {
  const response = await httpClient.get<unknown>(
    `/api/v1/lost-reports/${encodeURIComponent(reportId)}`,
  );

  // Unwrap { success: true, data: {...} } envelope from the API
  const body = response.data;
  const bodyRec = asRecord(body);
  const rawDetail = (bodyRec && asRecord(bodyRec.data)) ?? body;

  const base = normalizeLostReportDetailBase(rawDetail);
  if (!base) {
    throw new Error('Respuesta inválida al cargar el detalle del reporte');
  }

  // Use sightings embedded in the detail response when available
  let sightings: LostReportSighting[] = normalizeSightingsList(rawDetail);

  if (sightings.length === 0) {
    try {
      const sightingsRes = await httpClient.get<unknown>(
        `/api/v1/lost-reports/${encodeURIComponent(reportId)}/sightings`,
      );
      sightings = normalizeSightingsList(sightingsRes.data);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('getLostReportDetail: fallo al cargar sightings:', e);
    }
  }

  return {
    ...base,
    sightings,
  };
}

function normalizeCreateSightingResponse(data: unknown): CreateLostReportSightingResult {
  const root = asRecord(data);
  if (!root) return {};
  const nested = asRecord(root.data) ?? asRecord(root.result) ?? root;
  const notified =
    asNumber(root.notifiedUsersCount) ??
    asNumber(root.notifiedCount) ??
    asNumber(nested.notifiedUsersCount);
  const searchRadiusKm =
    asNumber(root.searchRadiusKm) ?? asNumber(nested.searchRadiusKm) ?? asNumber(root.radiusKm);
  return { notifiedUsersCount: notified, searchRadiusKm };
}

async function createSighting(
  reportId: string,
  dto: CreateLostReportSightingDto,
): Promise<CreateLostReportSightingResult> {
  const form = new FormData();
  form.append('lat', String(dto.lat));
  form.append('lng', String(dto.lng));
  if (dto.notes != null && String(dto.notes).trim().length > 0) {
    form.append('notes', String(dto.notes).trim());
  }

  for (const uri of dto.photoUris ?? []) {
    const filename = uri.split('/').pop() ?? 'sighting.jpg';
    const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : undefined;
    const mimeType = ext ? guessImageMimeType(`.${ext}`) : guessImageMimeType(filename);
    form.append('photos', {
      uri,
      name: filename.includes('.') ? filename : 'sighting.jpg',
      type: mimeType,
    } as unknown as Blob);
  }

  const res = await httpClient.post(
    `/api/v1/lost-reports/${encodeURIComponent(reportId)}/sightings`,
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return normalizeCreateSightingResponse(res.data);
}

export interface UpdateLostReportDto {
  lat: number;
  lng: number;
  /** ISO 8601 */
  lastSeenAt: string;
  message?: string | null;
}

async function updateLostReport(reportId: string, dto: UpdateLostReportDto): Promise<void> {
  await httpClient.patch(`/api/v1/lost-reports/${encodeURIComponent(reportId)}`, {
    lat: dto.lat,
    lng: dto.lng,
    lastSeenAt: dto.lastSeenAt,
    ...(dto.message != null && String(dto.message).trim().length > 0
      ? { message: dto.message.trim() }
      : {}),
  });
}

async function resolveLostReport(reportId: string): Promise<ResolveLostReportResult> {
  const res = await httpClient.patch<unknown>(
    `/api/v1/lost-reports/${encodeURIComponent(reportId)}/resolve`,
    {},
  );

  const record = asRecord(res.data) ?? {};
  const nested = asRecord(record.data) ?? asRecord(record.result) ?? record;
  const resolvedAt =
    asString(record.resolvedAt) ?? asString(record.resolved_at) ?? asString(nested.resolvedAt);
  const notifiedUsersCount =
    asNumber(record.notifiedUsersCount) ??
    asNumber(record.notifiedCount) ??
    asNumber(nested.notifiedUsersCount);
  const sightingsCount =
    asNumber(record.sightingsCount) ??
    asNumber(nested.sightingsCount) ??
    asNumber(record.sightings);
  const totalMinutes =
    asNumber(record.totalMinutes) ??
    asNumber(record.total_minutes) ??
    asNumber(nested.totalMinutes);
  return { resolvedAt, notifiedUsersCount, sightingsCount, totalMinutes };
}

function normalizeMyReport(raw: unknown): MyLostReportSummary | null {
  const record = asRecord(raw);
  if (!record) return null;
  const pet = asRecord(record.pet) ?? record;

  const speciesRaw =
    asString(pet.species) ?? asString(record.petSpecies) ?? asString(pet.type) ?? 'other';
  const species = petSpeciesSchema.safeParse(speciesRaw.toLowerCase());

  const resolvedAt = asString(record.resolvedAt) ?? asString(record.resolved_at) ?? null;
  const kindRaw = asString(record.reportKind) ?? asString(record.kind) ?? asString(record.status);
  const lower = kindRaw?.toLowerCase() ?? '';
  const reportKind =
    resolvedAt != null || lower === 'resolved' || lower === 'resuelto'
      ? ('resolved' as const)
      : lower === 'sighted' || lower === 'seen' || lower === 'avistado'
        ? ('sighted' as const)
        : ('lost' as const);

  const parsed = myLostReportSummarySchema.safeParse({
    id: asString(record.id) ?? asString(record.reportId),
    petName: asString(pet.name) ?? asString(record.petName) ?? 'Mascota',
    petSpecies: species.success ? species.data : 'other',
    petPhotoUrl:
      asString(pet.photoUrl) ?? asString(pet.imageUrl) ?? asString(record.petPhotoUrl) ?? null,
    reportKind,
    createdAt:
      asString(record.createdAt) ?? asString(record.reportedAt) ?? new Date().toISOString(),
    resolvedAt,
  });

  return parsed.success ? parsed.data : null;
}

async function getMyReports(): Promise<MyLostReportSummary[]> {
  const res = await httpClient.get<unknown>('/api/v1/lost-reports/mine');
  const record = asRecord(res.data);
  const list =
    (Array.isArray(res.data) ? res.data : null) ??
    (record && Array.isArray(record.data) ? record.data : null) ??
    (record && Array.isArray(record.items) ? record.items : null) ??
    [];

  return list
    .map((item) => normalizeMyReport(item))
    .filter((x): x is MyLostReportSummary => x != null);
}

export const reportsService = {
  getNearby,
  createLostReport,
  getMyReports,
  getLostReportDetail,
  createSighting,
  updateLostReport,
  resolveLostReport,
};
