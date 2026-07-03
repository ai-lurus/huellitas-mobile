import { z } from 'zod';

export const petSpeciesSchema = z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']);
export type PetSpecies = z.infer<typeof petSpeciesSchema>;

export const petSexSchema = z.enum(['male', 'female', 'unknown']);
export type PetSex = z.infer<typeof petSexSchema>;

export const petStatusSchema = z.enum(['lost', 'found']);
export type PetStatus = z.infer<typeof petStatusSchema>;

export const petSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  species: petSpeciesSchema.optional(),
  breed: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sex: petSexSchema.optional(),
  age: z.number().nullable().optional(),
  /** Fecha de nacimiento (ISO, solo fecha). La edad se calcula a partir de este campo. */
  birthDate: z.string().nullable().optional(),
  /** Peso en kilogramos. */
  weightKg: z.number().positive().nullable().optional(),
  /** Si la mascota tiene microchip registrado (el número se administra desde el Carnet). */
  hasMicrochip: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  /** URLs/ids de fotos (máximo 5 en UI). */
  photos: z.array(z.string()).optional(),
  /**
   * Estado explícito para mostrar badges (solo si está marcado).
   * - lost: mostrar badge PERDIDO
   * - found: mostrar badge ENCONTRADO
   */
  status: petStatusSchema.optional(),
  /** Si la mascota está marcada como perdida (badge PERDIDO en listado). */
  isLost: z.boolean().optional(),
  /** Token para generar QR de perfil público. */
  qrToken: z.string().optional(),
});

export type Pet = z.infer<typeof petSchema>;

export const petPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
  species: petSpeciesSchema,
  breed: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  age: z.number().nullable().optional(),
  coverPhotoUrl: z.string().nullable().optional(),
  isLost: z.boolean(),
});

export type PetPublic = z.infer<typeof petPublicSchema>;

export const petSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  species: petSpeciesSchema,
  breed: z.string().nullable().optional(),
  /** Foto principal para tarjeta (si existe). */
  photoUrl: z.string().nullable().optional(),
  status: petStatusSchema.optional(),
  isLost: z.boolean().optional(),
  age: z.number().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
});

export type PetSummary = z.infer<typeof petSummarySchema>;
