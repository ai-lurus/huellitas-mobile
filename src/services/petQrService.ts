import { z } from 'zod';

import type { PetPublic } from '../domain/pets';
import { petPublicSchema } from '../domain/pets';
import { httpClient } from '../network';

const qrTokenSchema = z.object({ qrToken: z.string() });

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

// API wraps responses as { success, data: <payload> }.
// Axios also wraps the response body in response.data.
// So we need to unwrap twice: response.data → API body → API body.data → payload.
function unwrap(res: unknown): unknown {
  const body = asRecord(res)?.['data'] ?? res; // axios response → API body
  const r = asRecord(body);
  return r?.['data'] ?? body; // API body → payload
}

async function getQrToken(petId: string): Promise<string> {
  const res = await httpClient.get(`/api/v1/pets/${petId}/qr`);
  const parsed = qrTokenSchema.parse(unwrap(res));
  return parsed.qrToken;
}

async function rotateQrToken(petId: string): Promise<string> {
  const res = await httpClient.post(`/api/v1/pets/${petId}/qr/rotate`, {});
  const parsed = qrTokenSchema.parse(unwrap(res));
  return parsed.qrToken;
}

async function getPublicProfile(qrToken: string): Promise<PetPublic> {
  const res = await httpClient.get(`/api/v1/public/pets/${qrToken}`);
  return petPublicSchema.parse(unwrap(res));
}

export const petQrService = { getQrToken, rotateQrToken, getPublicProfile };
