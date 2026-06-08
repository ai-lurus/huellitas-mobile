import { z } from 'zod';

export const placeCategorySchema = z.enum([
  'park',
  'restaurant',
  'cafe',
  'hotel',
  'vet',
  'groomer',
  'petshop',
  'beach',
  'other',
]);
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  lat: z.number(),
  lng: z.number(),
  address: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  photoUrls: z.array(z.string()).default([]),
  coverPhotoUrl: z.string().nullable().optional(),
  submittedBy: z.string().nullable().optional(),
  upvoteCount: z.number().default(0),
  hasUpvoted: z.boolean().optional(),
  createdAt: z.string(),
});

export type Place = z.infer<typeof placeSchema>;

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  park: 'Parque',
  restaurant: 'Restaurante',
  cafe: 'Café',
  hotel: 'Hotel',
  vet: 'Veterinaria',
  groomer: 'Estética',
  petshop: 'Tienda',
  beach: 'Playa',
  other: 'Otro',
};

export const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  park: '🌳',
  restaurant: '🍽️',
  cafe: '☕',
  hotel: '🏨',
  vet: '🩺',
  groomer: '✂️',
  petshop: '🛍️',
  beach: '🏖️',
  other: '📍',
};
