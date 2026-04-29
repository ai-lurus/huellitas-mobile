import { z } from 'zod';

import { petSpeciesSchema } from './pets';

export const lostReportKindSchema = z.enum(['lost', 'sighted']);

export const lostReportSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lng: z.number(),
  petName: z.string(),
  petBreed: z.string().nullable().optional(),
  petSpecies: petSpeciesSchema,
  petPhotoUrl: z.string().nullable().optional(),
  distanceMeters: z.number().nonnegative(),
  createdAt: z.string(),
  /** Perdido vs avistamiento (para UI: PERDIDO / VISTO). */
  reportKind: lostReportKindSchema.default('lost'),
});

export type LostReport = z.infer<typeof lostReportSchema>;

export type LostReportSpeciesFilter = 'all' | 'dog' | 'cat' | 'other';
