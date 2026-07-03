export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export const FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  once: 'Única vez',
  daily: 'Diaria',
  weekly: 'Semanal',
  monthly: 'Mensual',
  custom: 'Personalizada',
};

export const FREQUENCY_ORDER: readonly TaskFrequency[] = [
  'once',
  'daily',
  'weekly',
  'monthly',
  'custom',
];

export interface RoutineTask {
  id: string;
  title: string;
  description?: string | null;
  frequency: TaskFrequency;
  /** ISO, fecha y hora programada. */
  dueAt: string;
  completed: boolean;
}

const FREQUENCY_INTERVAL_MS: Partial<Record<TaskFrequency, number>> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

/**
 * PRD §4.5.1: la siguiente ocurrencia se calcula desde la fecha original programada
 * (no desde la fecha real de completado), para evitar que el desfase se acumule.
 * `null` para tareas de única vez o frecuencia personalizada (sin regla automática).
 */
export function computeNextOccurrence(task: RoutineTask): string | null {
  const interval = FREQUENCY_INTERVAL_MS[task.frequency];
  if (!interval) return null;
  return new Date(new Date(task.dueAt).getTime() + interval).toISOString();
}

export function isTaskOverdue(task: RoutineTask): boolean {
  return !task.completed && new Date(task.dueAt).getTime() < Date.now();
}

export function sortRoutineTasks(tasks: readonly RoutineTask[]): RoutineTask[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isTaskOverdue(a);
    const bOverdue = isTaskOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

let mockRoutineIdCounter = 0;
export function createMockRoutineTaskId(): string {
  mockRoutineIdCounter += 1;
  return `routine-task-${Date.now()}-${mockRoutineIdCounter}`;
}

/** Mock semi-vivo por mascota mientras no exista el backend de Rutina (PRD §4.5). */
export function buildMockRoutineTasks(petId: string, petName: string): RoutineTask[] {
  const now = Date.now();
  const seed = petId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;

  return [
    {
      id: `mock-routine-${petId}-0`,
      title: 'Paseo matutino',
      description: null,
      frequency: 'daily',
      dueAt: new Date(now - 3 * HOUR_MS).toISOString(),
      completed: false,
    },
    {
      id: `mock-routine-${petId}-1`,
      title: 'Croquetas',
      description: null,
      frequency: 'daily',
      dueAt: new Date(now + 6 * HOUR_MS).toISOString(),
      completed: false,
    },
    {
      id: `mock-routine-${petId}-2`,
      title: 'Vacuna de refuerzo',
      description: `Aplicar la siguiente dosis a ${petName}`,
      frequency: 'once',
      dueAt: new Date(now + ((seed % 10) + 3) * DAY_MS).toISOString(),
      completed: false,
    },
  ];
}
