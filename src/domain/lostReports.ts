import { z } from 'zod';

import { petSpeciesSchema } from './pets';

export const lostReportKindSchema = z.enum(['lost', 'sighted', 'resolved']);

export const lostReportSchema = z.object({
  id: z.string(),
  lat: z.number(),
  lng: z.number(),
  petName: z.string(),
  petBreed: z.string().nullable().optional(),
  petSpecies: petSpeciesSchema,
  petPhotoUrl: z.string().nullable().optional(),
  /** Texto corto opcional para cards (mensaje/descr.) */
  description: z.string().trim().min(1).optional(),
  /** Ubicación humana opcional (colonia/ciudad). */
  locationLabel: z.string().trim().min(1).optional(),
  distanceMeters: z.number().nonnegative(),
  createdAt: z.string(),
  /** Perdido vs avistamiento (para UI: PERDIDO / VISTO). */
  reportKind: lostReportKindSchema.default('lost'),
});

export type LostReport = z.infer<typeof lostReportSchema>;

export type LostReportSpeciesFilter = 'all' | 'dog' | 'cat' | 'other';
