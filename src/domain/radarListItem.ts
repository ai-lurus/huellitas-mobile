import type { Href } from 'expo-router';

import type { LostReport, LostReportSpeciesFilter, MapReportTypeFilter } from './lostReports';
import type { PetSpecies } from './pets';
import type { StrayReport } from './strayReports';

/**
 * Vista normalizada usada por la Lista de Radar (PRD §5.2): unifica reportes de
 * mascota perdida (`LostReport`) y avistamientos de mascota suelta (`StrayReport`)
 * en una sola forma para poder ordenarlos/filtrarlos juntos.
 */
export type RadarListItemKind = 'lost' | 'sighted' | 'found';

export interface RadarListItem {
  id: string;
  kind: RadarListItemKind;
  name: string;
  species: PetSpecies;
  breed?: string | null;
  photoUrl?: string | null;
  distanceMeters: number;
  createdAt: string;
  href: Href;
}

/** PRD §5.4: un reporte resuelto deja de aparecer en el mapa/lista activa. */
export function isActiveLostReport(report: LostReport): boolean {
  return report.reportKind !== 'resolved';
}

export function isActiveStrayReport(report: StrayReport): boolean {
  return report.status === 'unmatched';
}

export function fromLostReport(report: LostReport): RadarListItem {
  return {
    id: report.id,
    kind: report.reportKind === 'sighted' ? 'sighted' : 'lost',
    name: report.petName,
    species: report.petSpecies,
    breed: report.petBreed,
    photoUrl: report.petPhotoUrl,
    distanceMeters: report.distanceMeters,
    createdAt: report.createdAt,
    href: `/(app)/reports/${report.id}` as Href,
  };
}

export function fromStrayReport(report: StrayReport, distanceMeters: number): RadarListItem {
  return {
    id: report.id,
    kind: 'found',
    name: 'Mascota sin identificar',
    species: report.species,
    breed: null,
    photoUrl: report.photoUrl,
    distanceMeters,
    createdAt: report.createdAt,
    href: `/(app)/stray/${report.id}` as Href,
  };
}

export function matchesTypeFilter(kind: RadarListItemKind, filter: MapReportTypeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'lost') return kind === 'lost' || kind === 'sighted';
  return kind === 'found';
}

export function matchesSpeciesFilter(
  species: PetSpecies,
  filter: LostReportSpeciesFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'other') return species !== 'dog' && species !== 'cat';
  return species === filter;
}
