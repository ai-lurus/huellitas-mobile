import type { Pet } from './pets';

export interface Vaccine {
  id: string;
  name: string;
  /** ISO (fecha de aplicación, nunca futura). */
  appliedAt: string;
  /** ISO de la próxima dosis, si aplica. */
  nextDoseAt?: string | null;
}

export type VaccineStatus = 'upToDate' | 'overdue';

/** PRD §4.4.1: vencida si la próxima dosis ya pasó y no hay una aplicación más reciente. */
export function computeVaccineStatus(vaccine: Vaccine): VaccineStatus {
  if (!vaccine.nextDoseAt) return 'upToDate';
  return new Date(vaccine.nextDoseAt).getTime() < Date.now() ? 'overdue' : 'upToDate';
}

export function sortVaccinesByAppliedDateDesc(vaccines: readonly Vaccine[]): Vaccine[] {
  return [...vaccines].sort(
    (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
  );
}

let mockVaccineIdCounter = 0;
export function createMockVaccineId(): string {
  mockVaccineIdCounter += 1;
  return `vaccine-${Date.now()}-${mockVaccineIdCounter}`;
}

/** Mock semi-vivo mientras no exista el backend de Carnet (PRD §4.4). Determinístico por mascota. */
export function buildMockVaccines(petId: string): Vaccine[] {
  const now = Date.now();
  const seed = petId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const secondDoseOffsetDays = seed % 2 === 0 ? -10 : 160;
  const DAY_MS = 24 * 60 * 60 * 1000;

  return [
    {
      id: `mock-vaccine-${petId}-0`,
      name: 'Rabia',
      appliedAt: new Date(now - 120 * DAY_MS).toISOString(),
      nextDoseAt: new Date(now + 245 * DAY_MS).toISOString(),
    },
    {
      id: `mock-vaccine-${petId}-1`,
      name: 'Moquillo',
      appliedAt: new Date(now - 200 * DAY_MS).toISOString(),
      nextDoseAt: new Date(now + secondDoseOffsetDays * DAY_MS).toISOString(),
    },
  ];
}

export interface VaccinesSummary {
  status: VaccineStatus;
  /** ISO de la próxima dosis pendiente más cercana, o `null` si no hay ninguna programada. */
  nextDoseAt: string | null;
}

/** Resumen usado en la tarjeta "hero" de la Lista de mascotas (PRD wireframe 05). */
export function computeVaccinesSummary(vaccines: readonly Vaccine[]): VaccinesSummary {
  const status = vaccines.some((v) => computeVaccineStatus(v) === 'overdue')
    ? 'overdue'
    : 'upToDate';
  const upcoming = vaccines
    .map((v) => v.nextDoseAt)
    .filter((d): d is string => Boolean(d))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return { status, nextDoseAt: upcoming[0] ?? null };
}

export interface PetDocuments {
  certificateUrl: string | null;
  microchipNumber: string | null;
}

function deterministicDigits(seedStr: string, length: number): string {
  let n = seedStr.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    n = (n * 9301 + 49297) % 233280;
    out += Math.floor((n / 233280) * 10);
  }
  return out;
}

/** Genera un número de microchip mock si la mascota tiene `hasMicrochip`. */
export function buildMockDocuments(pet: Pick<Pet, 'id' | 'hasMicrochip'>): PetDocuments {
  return {
    certificateUrl: null,
    microchipNumber: pet.hasMicrochip ? deterministicDigits(pet.id, 15) : null,
  };
}
