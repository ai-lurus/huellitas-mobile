import { canSelfCancel, CANCEL_THRESHOLD_HOURS } from '../bookings';

describe('canSelfCancel', () => {
  const now = new Date('2026-07-03T10:00:00.000Z');

  it('permite cancelar cuando faltan más de 2 horas para la cita', () => {
    const scheduledAt = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    expect(canSelfCancel(scheduledAt, now)).toBe(true);
  });

  it('bloquea la auto-cancelación dentro del umbral de 2 horas', () => {
    const scheduledAt = new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString();
    expect(canSelfCancel(scheduledAt, now)).toBe(false);
  });

  it('permite cancelar cuando no hay cita programada (ej. entrega de Croquetas)', () => {
    expect(canSelfCancel(null, now)).toBe(true);
    expect(canSelfCancel(undefined, now)).toBe(true);
  });

  it('el umbral configurado es de 2 horas', () => {
    expect(CANCEL_THRESHOLD_HOURS).toBe(2);
  });
});
