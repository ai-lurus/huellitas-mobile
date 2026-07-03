import { z } from 'zod';

import { petSpeciesSchema } from './pets';

const nonEmptyString = z.string().trim().min(1);

const optionalNonEmptyString = nonEmptyString
  .optional()
  .transform((v) => (v != null ? v : undefined));

export const userSummarySchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  imageUrl: optionalNonEmptyString,
});

export type UserSummary = z.infer<typeof userSummarySchema>;

export const coordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;

export const lostReportSightingSchema = z.object({
  id: nonEmptyString,
  createdAt: nonEmptyString,
  user: userSummarySchema,
  location: coordinatesSchema,
  notes: optionalNonEmptyString,
  photoUrls: z.array(nonEmptyString).optional(),
});

export type LostReportSighting = z.infer<typeof lostReportSightingSchema>;

export const lostReportDetailSchema = z.object({
  id: nonEmptyString,

  /** Quien reportó la pérdida originalmente (Dueño). */
  ownerId: optionalNonEmptyString,

  petName: nonEmptyString,
  petSpecies: petSpeciesSchema,
  petBreed: z.string().trim().min(1).nullable().optional(),
  petPhotoUrl: optionalNonEmptyString.nullable().optional(),

  /** Fecha de creación del reporte (si el backend la expone). */
  createdAt: optionalNonEmptyString.optional(),

  /** Fecha y hora en que se perdió la mascota, capturada al crear el reporte. */
  lastSeenAt: optionalNonEmptyString.optional(),

  /** Mensaje del reporte de pérdida (si el backend lo expone). */
  message: z.string().trim().min(1).nullable().optional(),

  lossLocation: coordinatesSchema,

  /** Radio para el mapa; si no viene del backend, puede ser `undefined`. */
  lossRadiusMeters: z.number().positive().optional(),

  resolvedAt: optionalNonEmptyString.nullable().optional(),

  sightings: z.array(lostReportSightingSchema).default([]),
});

export type LostReportDetail = z.infer<typeof lostReportDetailSchema>;
