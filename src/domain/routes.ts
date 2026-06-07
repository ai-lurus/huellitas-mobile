import { z } from 'zod';

export const waypointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
export type Waypoint = z.infer<typeof waypointSchema>;

export const routeDifficultySchema = z.enum(['easy', 'moderate', 'hard']);
export type RouteDifficulty = z.infer<typeof routeDifficultySchema>;

export const routeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  waypoints: z.array(waypointSchema),
  distanceKm: z.number().nullable().optional(),
  difficulty: routeDifficultySchema.nullable().optional(),
  offLeashAllowed: z.boolean(),
  estimatedMinutes: z.number().nullable().optional(),
  photoUrls: z.array(z.string()).default([]),
  coverPhotoUrl: z.string().nullable().optional(),
  ratingAvg: z.number().default(0),
  ratingCount: z.number().default(0),
  userRating: z.number().nullable().optional(),
  createdAt: z.string(),
});

export type Route = z.infer<typeof routeSchema>;

export const DIFFICULTY_LABELS: Record<RouteDifficulty, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  hard: 'Difícil',
};

export const DIFFICULTY_COLORS: Record<RouteDifficulty, string> = {
  easy: '#22C55E',
  moderate: '#F59E0B',
  hard: '#EF4444',
};
