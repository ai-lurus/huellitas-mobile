import { z } from 'zod';

import type { StrayReport } from '../domain/strayReports';
import { strayReportSchema } from '../domain/strayReports';
import { httpClient } from '../network';
import type { StrayReportSubmitInput } from '../validation/strayReportSchema';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

function normalizeStrayReport(raw: unknown): StrayReport | null {
  const r = asRecord(raw);
  if (!r) return null;
  const parsed = strayReportSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function guessImageMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function getNearby(params: {
  lat: number;
  lng: number;
  radius: number;
  species?: string;
}): Promise<StrayReport[]> {
  const response = await httpClient.get<unknown>('/api/v1/stray-reports/nearby', {
    params: {
      lat: params.lat,
      lng: params.lng,
      radius: params.radius,
      ...(params.species ? { species: params.species } : {}),
    },
  });
  const body = asRecord(response.data);
  const list =
    (Array.isArray(response.data) ? response.data : null) ??
    (body && Array.isArray(body.data) ? body.data : null) ??
    [];
  return z
    .array(z.unknown())
    .parse(list)
    .map(normalizeStrayReport)
    .filter((s): s is StrayReport => s !== null);
}

async function getById(id: string): Promise<StrayReport> {
  const response = await httpClient.get<unknown>(`/api/v1/stray-reports/${encodeURIComponent(id)}`);
  const body = asRecord(response.data);
  const raw = (body && asRecord(body.data)) ?? body ?? response.data;
  const report = normalizeStrayReport(raw);
  if (!report) throw new Error('Respuesta inválida al cargar reporte de animal suelto');
  return report;
}

async function create(input: StrayReportSubmitInput): Promise<StrayReport> {
  const form = new FormData();
  form.append('species', input.species);
  form.append('lat', String(input.lat));
  form.append('lng', String(input.lng));
  if (input.color) form.append('color', input.color);
  if (input.description) form.append('description', input.description);

  for (const uri of input.photoUris ?? []) {
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    form.append('photos', {
      uri,
      name: filename.includes('.') ? filename : 'photo.jpg',
      type: guessImageMimeType(uri),
    } as unknown as Blob);
  }

  const response = await httpClient.post<unknown>('/api/v1/stray-reports', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const body = asRecord(response.data);
  const raw = (body && asRecord(body.data)) ?? body ?? response.data;
  const report = normalizeStrayReport(raw);
  if (!report) throw new Error('Respuesta inválida al crear reporte');
  return report;
}

async function matchToLostReport(strayId: string, lostReportId: string): Promise<void> {
  await httpClient.patch(`/api/v1/stray-reports/${encodeURIComponent(strayId)}/match`, {
    lostReportId,
  });
}

async function resolve(strayId: string): Promise<void> {
  await httpClient.patch(`/api/v1/stray-reports/${encodeURIComponent(strayId)}/resolve`, {});
}

export const strayService = { getNearby, getById, create, matchToLostReport, resolve };
