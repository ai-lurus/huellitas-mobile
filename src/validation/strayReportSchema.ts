import { z } from 'zod';

export const strayReportFormSchema = z.object({
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
  color: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
});

export type StrayReportForm = z.infer<typeof strayReportFormSchema>;

export const strayReportSubmitSchema = z.object({
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  color: z.string().max(100).optional(),
  description: z.string().max(300).optional(),
  photoUris: z.array(z.string()).max(3).optional(),
});

export type StrayReportSubmitInput = z.infer<typeof strayReportSubmitSchema>;
