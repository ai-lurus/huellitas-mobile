import { z } from 'zod';

import { httpClient } from '../network';

import {
  petSchema,
  petSummarySchema,
  type Pet,
  type PetSex,
  type PetSpecies,
  type PetSummary,
} from '../domain/pets';

export const MAX_PETS_PER_USER = 3;

export type CreatePetDto = {
  name: string;
  species: PetSpecies;
  sex: PetSex;
  breed?: string;
  color?: string;
  age?: number;
  notes?: string;
};

export type UpdatePetDto = Partial<CreatePetDto> & {
  name: string;
  species: PetSpecies;
  sex: PetSex;
};

const uploadPetPhotoResponseSchema = z.object({
  url: z.string().optional(),
  id: z.string().optional(),
});

function guessImageMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Algunos backends envuelven el recurso en `data` o `pet`. */
function unwrapCreatedPetBody(data: unknown): Record<string, unknown> | null {
  if (!isRecord(data)) return null;
  if (isRecord(data.data)) return data.data;
  if (isRecord(data.pet)) return data.pet;
  return data;
}

function readPetId(record: Record<string, unknown>): string | undefined {
  const id = record['id'];
  if (typeof id === 'string' && id.length > 0) return id;
  const petId = record['petId'];
  if (typeof petId === 'string' && petId.length > 0) return petId;
  const uuid = record['uuid'];
  if (typeof uuid === 'string' && uuid.length > 0) return uuid;
  return undefined;
}

function readNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length > 0 ? s : undefined;
}

function pushPhotoUrl(out: string[], url: string | undefined): void {
  if (!url) return;
  const trimmed = url.trim();
  if (!trimmed) return;
  if (!out.includes(trimmed)) out.push(trimmed);
}

function extractPhotoUrlFromItem(item: unknown): string | undefined {
  if (typeof item === 'string') return readNonEmptyString(item);
  if (!isRecord(item)) return undefined;
  return (
    readNonEmptyString(item.url) ??
    readNonEmptyString(item.uri) ??
    readNonEmptyString(item.path) ??
    readNonEmptyString(item.src) ??
    readNonEmptyString(item.photoUrl) ??
    readNonEmptyString(item.imageUrl)
  );
}

/**
 * Normaliza distintas formas comunes de payload de fotos del backend a `string[]`.
 * Ejemplos: `photos: string[]`, `images: {url}[]`, `media: [{url}]`, etc.
 */
function normalizePhotoUrlsFromRecord(record: Record<string, unknown>): string[] {
  const out: string[] = [];

  const candidates: unknown[] = [
    record['photos'],
    record['images'],
    record['imageUrls'],
    record['photoUrls'],
    record['gallery'],
    record['media'],
    record['attachments'],
  ];

  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    for (const item of c) {
      pushPhotoUrl(out, extractPhotoUrlFromItem(item));
    }
  }

  // A veces viene un solo objeto en vez de array
  for (const key of ['photo', 'image', 'coverPhoto', 'avatar', 'profilePhoto'] as const) {
    const v = record[key];
    pushPhotoUrl(out, extractPhotoUrlFromItem(v));
  }

  // URLs sueltas (prioridad baja; se agregan al final si no estaban)
  for (const key of ['photoUrl', 'imageUrl', 'coverUrl', 'avatarUrl'] as const) {
    pushPhotoUrl(out, readNonEmptyString(record[key]));
  }

  return out.slice(0, 25);
}

function mergePetRecordWithNormalizedPhotos(
  record: Record<string, unknown>,
  petId: string,
): Record<string, unknown> {
  const normalized = normalizePhotoUrlsFromRecord(record);
  const existing = Array.isArray(record['photos'])
    ? (record['photos'] as unknown[]).flatMap((p) => {
        const u = extractPhotoUrlFromItem(p);
        return u ? [u] : [];
      })
    : [];

  const mergedPhotos = [...existing, ...normalized].filter((u, idx, arr) => arr.indexOf(u) === idx);

  const photoUrl =
    readNonEmptyString(record['photoUrl']) ??
    readNonEmptyString(record['imageUrl']) ??
    (mergedPhotos.length > 0 ? mergedPhotos[0] : undefined);

  return {
    ...record,
    id: typeof record['id'] === 'string' && record['id'].length > 0 ? record['id'] : petId,
    photos: mergedPhotos.length > 0 ? mergedPhotos.slice(0, 5) : record['photos'],
    ...(photoUrl ? { photoUrl } : null),
  };
}

async function createPet(data: CreatePetDto): Promise<Pet> {
  const res = await httpClient.post<unknown>('/api/v1/pets', data);
  const body = unwrapCreatedPetBody(res.data);
  if (!body) {
    throw new Error('Respuesta inválida del servidor al crear la mascota.');
  }
  const id = readPetId(body);
  if (!id) {
    throw new Error(
      'El servidor no devolvió el id de la mascota. Revisa el contrato del POST /pets.',
    );
  }
  const merged = mergePetRecordWithNormalizedPhotos(body, id);
  return petSchema.parse(merged);
}

async function listPets(): Promise<PetSummary[]> {
  try {
    const res = await httpClient.get<unknown>('/api/v1/pets');
    const body = res.data;
    const list = Array.isArray(body) ? body : (body as { data?: unknown })?.data;
    if (!Array.isArray(list)) return [];
    const parsedList = z.array(z.record(z.string(), z.unknown())).safeParse(list);
    if (!parsedList.success) return [];

    const normalized = parsedList.data.map((raw) => {
      if (!isRecord(raw)) return raw;
      const photos = normalizePhotoUrlsFromRecord(raw);
      const photoUrl =
        readNonEmptyString(raw['photoUrl']) ?? readNonEmptyString(raw['imageUrl']) ?? photos[0];
      return { ...raw, photoUrl: photoUrl ?? raw['photoUrl'] };
    });

    const parsed = z.array(petSummarySchema).safeParse(normalized);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function getPet(petId: string): Promise<Pet> {
  const res = await httpClient.get<unknown>(`/api/v1/pets/${petId}`);
  const body = res.data;
  const record = isRecord(body)
    ? isRecord(body.data)
      ? body.data
      : isRecord(body.pet)
        ? body.pet
        : body
    : {};
  const merged = mergePetRecordWithNormalizedPhotos(isRecord(record) ? record : {}, petId);
  return petSchema.parse(merged);
}

async function updatePet(petId: string, data: UpdatePetDto): Promise<Pet> {
  const res = await httpClient.patch<unknown>(`/api/v1/pets/${petId}`, data);
  const body = res.data;
  const record = isRecord(body)
    ? isRecord(body.data)
      ? body.data
      : isRecord(body.pet)
        ? body.pet
        : body
    : {};
  const merged = mergePetRecordWithNormalizedPhotos(isRecord(record) ? record : {}, petId);
  return petSchema.parse(merged);
}

async function deletePet(petId: string): Promise<void> {
  await httpClient.delete(`/api/v1/pets/${petId}`);
}

async function uploadPetPhoto(petId: string, photoUri: string): Promise<string> {
  const filename = photoUri.split('/').pop() ?? 'photo.jpg';
  const form = new FormData();
  form.append('photo', {
    uri: photoUri,
    name: filename.includes('.') ? filename : 'photo.jpg',
    type: guessImageMimeType(filename),
  } as unknown as Blob);

  const res = await httpClient.post<unknown>(`/api/v1/pets/${petId}/photos`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const parsed = uploadPetPhotoResponseSchema.safeParse(res.data);
  if (parsed.success) return parsed.data.url ?? parsed.data.id ?? '';
  return '';
}

export const petsService = {
  createPet,
  uploadPetPhoto,
  listPets,
  getPet,
  updatePet,
  deletePet,
};
