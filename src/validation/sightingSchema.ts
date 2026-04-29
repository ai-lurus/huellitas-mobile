import { z } from 'zod';

export const SIGHTING_NOTES_MAX_LENGTH = 500;

export const sightingFormSchema = z.object({
  photos: z.array(z.string().min(1)).min(1, 'Agrega al menos 1 foto del avistamiento'),

  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable()
    .refine((v): v is { lat: number; lng: number } => v != null, 'Ubicación requerida'),

  notes: z
    .string()
    .trim()
    .max(SIGHTING_NOTES_MAX_LENGTH)
    .optional()
    .transform((v) => (v != null && v.length > 0 ? v : undefined)),
});

export type SightingFormValues = z.infer<typeof sightingFormSchema>;
export type SightingFormInput = z.input<typeof sightingFormSchema>;
