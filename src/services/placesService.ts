import type { Place } from '../domain/places';
import { placeSchema } from '../domain/places';
import { httpClient } from '../network';
import type { PlaceSubmitInput } from '../validation/placeSchema';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

function extractData(res: unknown): unknown {
  const r = asRecord(res);
  return r?.['data'] ?? r;
}

function normalizePlace(raw: unknown): Place | null {
  const parsed = placeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function getNearby(params: {
  lat: number;
  lng: number;
  radius: number;
  category?: string;
}): Promise<Place[]> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius: String(params.radius),
    ...(params.category ? { category: params.category } : {}),
  });
  const res = await httpClient.get(`/api/v1/places?${query.toString()}`);
  const data = extractData(res);
  if (!Array.isArray(data)) return [];
  return data.map(normalizePlace).filter((p): p is Place => p !== null);
}

async function getById(id: string): Promise<Place> {
  const res = await httpClient.get(`/api/v1/places/${id}`);
  return placeSchema.parse(extractData(res));
}

async function create(input: PlaceSubmitInput): Promise<Place> {
  const body: Record<string, unknown> = {
    name: input.name,
    category: input.category,
    lat: input.lat,
    lng: input.lng,
  };
  if (input.address) body['address'] = input.address;
  if (input.description) body['description'] = input.description;

  const res = await httpClient.post('/api/v1/places', body);
  const place = placeSchema.parse(extractData(res));

  if (input.photoUri) {
    const formData = new FormData();
    const filename = input.photoUri.split('/').pop() ?? 'photo.jpg';
    const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    formData.append('photo', {
      uri: input.photoUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
    await httpClient.post(`/api/v1/places/${place.id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  return place;
}

async function upvote(placeId: string): Promise<number> {
  const res = await httpClient.post(`/api/v1/places/${placeId}/upvote`, {});
  const data = asRecord(extractData(res));
  return typeof data?.['upvoteCount'] === 'number' ? data['upvoteCount'] : 0;
}

async function removeUpvote(placeId: string): Promise<number> {
  const res = await httpClient.delete(`/api/v1/places/${placeId}/upvote`);
  const data = asRecord(extractData(res));
  return typeof data?.['upvoteCount'] === 'number' ? data['upvoteCount'] : 0;
}

export const placesService = { getNearby, getById, create, upvote, removeUpvote };
