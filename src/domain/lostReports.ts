import { z } from 'zod';

import { LOST_REPORT_AUTO_ARCHIVE_DAYS } from '../config/constants';
import { petSpeciesSchema } from './pets';

export const lostReportKindSchema = z.enum(['lost', 'sighted', 'resolved']);

export const lostReportSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
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

/**
 * Resumen de un reporte propio para Settings §7.6 (Mis reportes). A diferencia
 * de {@link lostReportSchema}, no requiere distancia/coordenadas porque no
 * proviene de una búsqueda geográfica sino del historial del usuario.
 */
export const myLostReportSummarySchema = z.object({
  id: z.string(),
  petName: z.string(),
  petSpecies: petSpeciesSchema,
  petPhotoUrl: z.string().nullable().optional(),
  reportKind: lostReportKindSchema.default('lost'),
  createdAt: z.string(),
  resolvedAt: z.string().nullable().optional(),
});

export type MyLostReportSummary = z.infer<typeof myLostReportSummarySchema>;

export type LostReportSpeciesFilter = 'all' | 'dog' | 'cat' | 'other';

export type MapReportTypeFilter = 'all' | 'lost' | 'stray';

/**
 * Un reporte sin resolver que lleva más de {@link LOST_REPORT_AUTO_ARCHIVE_DAYS} días publicado
 * se considera "Inactivo" (PRD §5.4.1): deja de mostrarse en mapa/lista activa.
 */
export function isLostReportArchived(
  createdAt: string | null | undefined,
  isResolved: boolean,
  now: Date = new Date(),
): boolean {
  if (isResolved || !createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const ageDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > LOST_REPORT_AUTO_ARCHIVE_DAYS;
}
