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
  return petSchema.parse({ ...body, id });
}

async function listPets(): Promise<PetSummary[]> {
  try {
    const res = await httpClient.get<unknown>('/api/v1/pets');
    const body = res.data;
    const list = Array.isArray(body) ? body : (body as { data?: unknown })?.data;
    if (!Array.isArray(list)) return [];
    const parsed = z.array(petSummarySchema).safeParse(list);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
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
  deletePet,
};
