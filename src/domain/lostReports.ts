import { z } from 'zod';

import { petSpeciesSchema } from './pets';

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
});

export type LostReport = z.infer<typeof lostReportSchema>;

export type LostReportSpeciesFilter = 'all' | 'dog' | 'cat' | 'other';
