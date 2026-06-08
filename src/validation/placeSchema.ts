import { z } from 'zod';
import { placeCategorySchema } from '../domain/places';

export const placeFormSchema = z.object({
  name: z.string().trim().min(2, 'Nombre muy corto').max(120),
  category: placeCategorySchema,
  address: z.string().trim().max(200).optional(),
  description: z.string().trim().max(300).optional(),
});

export type PlaceFormValues = z.infer<typeof placeFormSchema>;

export const placeSubmitSchema = placeFormSchema.extend({
  lat: z.number(),
  lng: z.number(),
  photoUri: z.string().optional(),
});

export type PlaceSubmitInput = z.infer<typeof placeSubmitSchema>;
