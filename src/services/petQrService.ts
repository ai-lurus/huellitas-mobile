import { z } from 'zod';

import type { PetPublic } from '../domain/pets';
import { petPublicSchema } from '../domain/pets';
import { httpClient } from '../network';

const qrTokenSchema = z.object({ qrToken: z.string() });

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

function extractData(res: unknown): unknown {
  const r = asRecord(res);
  return r?.['data'] ?? r;
}

async function getQrToken(petId: string): Promise<string> {
  const res = await httpClient.get(`/api/v1/pets/${petId}/qr`);
  const parsed = qrTokenSchema.parse(extractData(res));
  return parsed.qrToken;
}

async function rotateQrToken(petId: string): Promise<string> {
  const res = await httpClient.post(`/api/v1/pets/${petId}/qr/rotate`, {});
  const parsed = qrTokenSchema.parse(extractData(res));
  return parsed.qrToken;
}

async function getPublicProfile(qrToken: string): Promise<PetPublic> {
  const res = await httpClient.get(`/api/v1/public/pets/${qrToken}`);
  return petPublicSchema.parse(extractData(res));
}

export const petQrService = { getQrToken, rotateQrToken, getPublicProfile };
