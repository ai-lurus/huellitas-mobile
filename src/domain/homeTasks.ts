import type { Ionicons } from '@expo/vector-icons';

import type { Pet } from './pets';

export interface HomeTask {
  id: string;
  petId: string;
  petName: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  dueAt: string;
  overdue: boolean;
  completed: boolean;
}

export interface HomeReminder {
  id: string;
  petId: string;
  petName: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  dueAt: string;
}

interface HomeTaskTemplate {
  title: (petName: string) => string;
  icon: keyof typeof Ionicons.glyphMap;
  offsetHours: number;
}

interface HomeReminderTemplate {
  title: (petName: string) => string;
  icon: keyof typeof Ionicons.glyphMap;
  offsetDays: number;
}

// Tareas diarias (checkeables) mostradas en "Tareas de hoy".
const HOME_TASK_TEMPLATES: readonly HomeTaskTemplate[] = [
  { title: (name) => `Paseo matutino · ${name}`, icon: 'walk-outline', offsetHours: -14 },
  { title: (name) => `Croquetas AM · ${name}`, icon: 'restaurant-outline', offsetHours: -10 },
  { title: (name) => `Paseo vespertino · ${name}`, icon: 'walk-outline', offsetHours: 4 },
  { title: (name) => `Croquetas PM · ${name}`, icon: 'restaurant-outline', offsetHours: 8 },
];

// Pendientes no diarios (médicos/estética) mostrados en "Recordatorios".
const HOME_REMINDER_TEMPLATES: readonly HomeReminderTemplate[] = [
  { title: (name) => `Vacuna refuerzo · ${name}`, icon: 'medkit-outline', offsetDays: 5 },
  { title: (name) => `Baño y corte · ${name}`, icon: 'cut-outline', offsetDays: 12 },
];

/**
 * Genera tareas de placeholder mientras no exista el módulo real de Rutina
 * (PRD §4.5). Determinístico por mascota para no cambiar entre renders.
 * `completed` siempre inicia en false: el estado de check es local a la sesión
 * (ver useState en el screen), no se persiste.
 */
export function buildMockHomeTasks(pets: readonly Pet[]): HomeTask[] {
  const now = Date.now();
  return pets.flatMap((pet, petIndex): HomeTask[] => {
    const petName = pet.name ?? 'tu mascota';
    const templateA = HOME_TASK_TEMPLATES[petIndex % HOME_TASK_TEMPLATES.length];
    const templateB = HOME_TASK_TEMPLATES[(petIndex + 2) % HOME_TASK_TEMPLATES.length];

    return [templateA, templateB].map((template, taskIndex) => {
      const dueAt = new Date(now + template.offsetHours * 60 * 60 * 1000).toISOString();
      return {
        id: `mock-task-${pet.id}-${taskIndex}`,
        petId: pet.id,
        petName,
        title: template.title(petName),
        icon: template.icon,
        dueAt,
        overdue: new Date(dueAt).getTime() < now,
        completed: false,
      };
    });
  });
}

export function sortHomeTasks(tasks: readonly HomeTask[]): HomeTask[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

/**
 * Placeholder de "Recordatorios": un pendiente no-diario por mascota.
 * Igual que las tareas, se reemplaza cuando exista el módulo real de Rutina.
 */
export function buildMockHomeReminders(pets: readonly Pet[]): HomeReminder[] {
  const now = Date.now();
  return pets.map((pet, petIndex) => {
    const petName = pet.name ?? 'tu mascota';
    const template = HOME_REMINDER_TEMPLATES[petIndex % HOME_REMINDER_TEMPLATES.length];
    const dueAt = new Date(now + template.offsetDays * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: `mock-reminder-${pet.id}`,
      petId: pet.id,
      petName,
      title: template.title(petName),
      icon: template.icon,
      dueAt,
    };
  });
}

/**
 * Racha "semi-viva": el número base es determinístico por mascota (mock),
 * y sube +1 mientras todas las tareas de hoy estén marcadas como completas.
 * No persiste entre sesiones — placeholder hasta que exista Rutina real.
 */
export function computeMockStreakDays(
  pets: readonly Pet[],
  allTodayTasksCompleted: boolean,
): number {
  if (pets.length === 0) return 0;
  const seed = pets.reduce(
    (acc, pet) => acc + pet.id.split('').reduce((charAcc, ch) => charAcc + ch.charCodeAt(0), 0),
    0,
  );
  const base = 4 + (seed % 15);
  return allTodayTasksCompleted ? base + 1 : base;
}
