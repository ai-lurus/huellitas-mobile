import { z } from 'zod';

import { petSpeciesSchema } from './pets';

export const strayStatusSchema = z.enum(['unmatched', 'matched', 'resolved']);
export type StrayStatus = z.infer<typeof strayStatusSchema>;

export const strayReportSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  species: petSpeciesSchema,
  color: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  status: strayStatusSchema.default('unmatched'),
  matchedReportId: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  seenAt: z.string(),
  createdAt: z.string(),
});

export type StrayReport = z.infer<typeof strayReportSchema>;
