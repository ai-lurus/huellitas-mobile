import { z } from 'zod';

import type { AuthUser } from './authService';
import { httpClient } from '../network';
import type { OnboardingProfileUpdatePayload } from '../types/onboarding';
import { publicUserProfileSchema, type PublicUserProfile } from '../domain/userProfile';
import { petSpeciesSchema } from '../domain/pets';
import { lostReportKindSchema } from '../domain/lostReports';

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.union([z.string().url(), z.null()]).optional(),
  alertRadiusKm: z.number().optional(),
  alertsEnabled: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  emailAlertsEnabled: z.boolean().optional(),
});

const meSchema = userSchema;

function isLocalImageUri(uri: string): boolean {
  return uri.startsWith('file:') || uri.startsWith('content:') || uri.startsWith('ph://');
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
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export interface UserSettingsPatchPayload {
  alertRadiusKm?: number;
  alertsEnabled?: boolean;
  notificationsEnabled?: boolean;
  emailAlertsEnabled?: boolean;
}

export interface UserLocationPayload {
  lat: number;
  lng: number;
}

export type MeProfile = {
  user: AuthUser;
  settings: {
    alertRadiusKm?: number;
    alertsEnabled?: boolean;
    pushNotificationsEnabled?: boolean;
    emailAlertsEnabled?: boolean;
  };
};

async function getMe(): Promise<MeProfile> {
  const res = await httpClient.get<unknown>('/users/me');
  const parsed = meSchema.parse(res.data);
  return {
    user: {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      image: parsed.image ?? undefined,
    },
    settings: {
      alertRadiusKm: parsed.alertRadiusKm,
      alertsEnabled: parsed.alertsEnabled,
      pushNotificationsEnabled: parsed.notificationsEnabled,
      emailAlertsEnabled: parsed.emailAlertsEnabled,
    },
  };
}

function normalizeActiveReport(raw: unknown) {
  const record = asRecord(raw);
  if (!record) return null;

  const pet = asRecord(record.pet) ?? asRecord(record.petInfo) ?? record;
  const id = asString(record.id) ?? asString(record.reportId);
  const petName = asString(pet.name) ?? asString(record.petName) ?? asString(record.name);

  const speciesRaw =
    asString(pet.species) ?? asString(record.petSpecies) ?? asString(pet.type) ?? 'other';
  const speciesParsed = petSpeciesSchema.safeParse(speciesRaw.toLowerCase());
  if (!id || !petName || !speciesParsed.success) return null;

  const breed = asString(pet.breed) ?? asString(record.petBreed) ?? null;
  const petPhotoUrl =
    asString(pet.photoUrl) ??
    asString(pet.imageUrl) ??
    asString(pet.coverPhotoUrl) ??
    asString(pet.coverImageUrl) ??
    (Array.isArray(pet.photos)
      ? (pet.photos.find((x: unknown) => typeof x === 'string' && x.trim().length > 0) as
          | string
          | undefined)
      : undefined) ??
    null;

  const createdAt =
    asString(record.createdAt) ?? asString(record.reportedAt) ?? asString(record.created_at);

  const kindRaw = asString(record.reportKind) ?? asString(record.kind) ?? asString(record.status);
  const kindLower = kindRaw?.toLowerCase() ?? '';
  const reportKind = lostReportKindSchema.safeParse(kindLower).success
    ? (kindLower as 'lost' | 'sighted')
    : undefined;

  return {
    id,
    petName,
    petSpecies: speciesParsed.data,
    petBreed: breed,
    petPhotoUrl,
    reportKind,
    createdAt,
  };
}

async function getUserPublicProfile(userId: string): Promise<PublicUserProfile> {
  const encoded = encodeURIComponent(userId);

  let data: unknown;
  try {
    data = (await httpClient.get<unknown>(`/users/${encoded}`)).data;
  } catch (e) {
    // Fallback a prefijo /api/v1 si el backend lo usa en otras rutas.
    // eslint-disable-next-line no-console
    console.error('getUserPublicProfile: fallo /users/:id, probando /api/v1/users/:id', e);
    data = (await httpClient.get<unknown>(`/api/v1/users/${encoded}`)).data;
  }

  const record = asRecord(data);
  const root = record?.data && asRecord(record.data) ? record.data : (record ?? {});

  const profileCandidate = {
    id: asString(root.id) ?? asString(root.userId),
    name: asString(root.name) ?? asString(root.fullName) ?? asString(root.username),
    imageUrl: asString(root.imageUrl) ?? asString(root.image) ?? asString(root.avatarUrl) ?? null,
    createdAt: asString(root.createdAt) ?? asString(root.joinedAt) ?? undefined,
    joinedAt: asString(root.joinedAt) ?? asString(root.createdAt) ?? undefined,
    email: (() => {
      const email = asString(root.email);
      if (!email) return undefined;
      return userSchema.shape.email.safeParse(email).success ? email : undefined;
    })(),
    phone: asString(root.phone),
    medalsCount: asNumber(root.medalsCount) ?? asNumber(root.medals),
    petsHelpedCount:
      asNumber(root.petsHelpedCount) ?? asNumber(root.petsHelped) ?? asNumber(root.helpedPetsCount),
    activeReports: Array.isArray(root.activeLostReports)
      ? root.activeLostReports
      : Array.isArray(root.activeReports)
        ? root.activeReports
        : Array.isArray(root.lostReportsActive)
          ? root.lostReportsActive
          : undefined,
  };

  const withActiveReports = {
    ...profileCandidate,
    activeReports: Array.isArray(profileCandidate.activeReports)
      ? profileCandidate.activeReports
          .map((x: unknown) => normalizeActiveReport(x))
          .filter(
            (x: unknown): x is NonNullable<ReturnType<typeof normalizeActiveReport>> => x != null,
          )
      : undefined,
  };

  const parsed = publicUserProfileSchema.safeParse(withActiveReports);
  if (!parsed.success) {
    throw new Error('Respuesta inválida al cargar el perfil público');
  }

  return parsed.data;
}

async function updateProfile(payload: OnboardingProfileUpdatePayload): Promise<AuthUser> {
  const hasLocalImage =
    typeof payload.imageUri === 'string' &&
    payload.imageUri.length > 0 &&
    isLocalImageUri(payload.imageUri);

  if (hasLocalImage && payload.imageUri) {
    const uri = payload.imageUri;
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const form = new FormData();
    form.append('image', {
      uri,
      name: filename.includes('.') ? filename : 'photo.jpg',
      type: mimeType,
    } as unknown as Blob);
    if (payload.name != null) form.append('name', payload.name);
    if (payload.locationEnabled != null) {
      form.append('locationEnabled', String(payload.locationEnabled));
    }
    if (payload.notificationsEnabled != null) {
      form.append('notificationsEnabled', String(payload.notificationsEnabled));
    }
    const res = await httpClient.patch<unknown>('/users/me', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const parsed = userSchema.parse(res.data);
    return {
      id: parsed.id,
      name: parsed.name,
      email: parsed.email,
      image: parsed.image ?? undefined,
    };
  }

  const body: Record<string, unknown> = {};
  if (payload.name != null) body['name'] = payload.name;
  if (payload.imageUri === null) body['image'] = null;
  else if (
    typeof payload.imageUri === 'string' &&
    payload.imageUri.length > 0 &&
    !isLocalImageUri(payload.imageUri)
  ) {
    body['image'] = payload.imageUri;
  }
  if (payload.locationEnabled != null) body['locationEnabled'] = payload.locationEnabled;
  if (payload.notificationsEnabled != null)
    body['notificationsEnabled'] = payload.notificationsEnabled;

  const res = await httpClient.patch<unknown>('/users/me', body);
  const parsed = userSchema.parse(res.data);
  return {
    id: parsed.id,
    name: parsed.name,
    email: parsed.email,
    image: parsed.image ?? undefined,
  };
}

async function patchSettings(payload: UserSettingsPatchPayload): Promise<MeProfile['settings']> {
  const res = await httpClient.patch<unknown>('/users/me', payload);
  const parsed = userSchema.parse(res.data);
  return {
    alertRadiusKm: parsed.alertRadiusKm,
    alertsEnabled: parsed.alertsEnabled,
    pushNotificationsEnabled: parsed.notificationsEnabled,
    emailAlertsEnabled: parsed.emailAlertsEnabled,
  };
}

async function deleteAccount(): Promise<void> {
  await httpClient.delete('/users/me');
}

async function patchMyLocation(payload: UserLocationPayload): Promise<void> {
  await httpClient.patch('/users/me/location', payload);
}

export const usersService = {
  getMe,
  getUserPublicProfile,
  updateProfile,
  patchSettings,
  patchMyLocation,
  deleteAccount,
};
