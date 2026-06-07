import type { Route } from '../domain/routes';
import { routeSchema } from '../domain/routes';
import { httpClient } from '../network';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

function extractData(res: unknown): unknown {
  const r = asRecord(res);
  return r?.['data'] ?? r;
}

function normalizeRoute(raw: unknown): Route | null {
  const parsed = routeSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function getNearby(params: {
  lat: number;
  lng: number;
  radius: number;
  difficulty?: string;
  offLeash?: boolean;
}): Promise<Route[]> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radius: String(params.radius),
    ...(params.difficulty ? { difficulty: params.difficulty } : {}),
    ...(params.offLeash ? { off_leash: 'true' } : {}),
  });
  const res = await httpClient.get(`/api/v1/routes?${query.toString()}`);
  const data = extractData(res);
  if (!Array.isArray(data)) return [];
  return data.map(normalizeRoute).filter((r): r is Route => r !== null);
}

async function getById(id: string): Promise<Route> {
  const res = await httpClient.get(`/api/v1/routes/${id}`);
  return routeSchema.parse(extractData(res));
}

interface CreateRouteInput {
  name: string;
  description?: string;
  waypoints: { lat: number; lng: number }[];
  distanceKm?: number;
  difficulty?: string;
  offLeashAllowed: boolean;
  estimatedMinutes?: number;
}

async function create(input: CreateRouteInput): Promise<Route> {
  const res = await httpClient.post('/api/v1/routes', input);
  return routeSchema.parse(extractData(res));
}

async function update(id: string, input: Partial<CreateRouteInput>): Promise<Route> {
  const res = await httpClient.patch(`/api/v1/routes/${id}`, input);
  return routeSchema.parse(extractData(res));
}

async function rate(
  routeId: string,
  rating: number,
): Promise<{ ratingAvg: number; ratingCount: number; userRating: number }> {
  const res = await httpClient.post(`/api/v1/routes/${routeId}/rate`, { rating });
  const data = asRecord(extractData(res));
  return {
    ratingAvg: typeof data?.['ratingAvg'] === 'number' ? data['ratingAvg'] : 0,
    ratingCount: typeof data?.['ratingCount'] === 'number' ? data['ratingCount'] : 0,
    userRating: typeof data?.['userRating'] === 'number' ? data['userRating'] : rating,
  };
}

export const routesService = { getNearby, getById, create, update, rate };
