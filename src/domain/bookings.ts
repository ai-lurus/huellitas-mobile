import { z } from 'zod';

import { serviceCategoryKeySchema } from './services';

export const bookingStatusSchema = z.enum(['pending', 'confirmed', 'cancelled']);
export type BookingStatus = z.infer<typeof bookingStatusSchema>;

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

export const bookingCartItemSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  quantity: z.number().int().positive(),
});
export type BookingCartItem = z.infer<typeof bookingCartItemSchema>;

export const bookingSchema = z.object({
  id: z.string(),
  serviceId: z.string(),
  serviceName: z.string(),
  categoryKey: serviceCategoryKeySchema,
  petId: z.string().nullable().optional(),
  petName: z.string().nullable().optional(),
  /** Fecha/hora de la cita (ISO). Ausente cuando la categoría usa ventana de entrega (Croquetas). */
  scheduledAt: z.string().nullable().optional(),
  deliveryWindowLabel: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  cart: z.array(bookingCartItemSchema).default([]),
  status: bookingStatusSchema,
  createdAt: z.string(),
});
export type Booking = z.infer<typeof bookingSchema>;

/** Umbral antes de la cita a partir del cual ya no se permite auto-cancelar (PRD §6.3.1). */
export const CANCEL_THRESHOLD_HOURS = 2;

/** Si el usuario aún puede cancelar por sí mismo (fuera del umbral) o debe contactar soporte. */
export function canSelfCancel(
  scheduledAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!scheduledAt) return true;
  const diffMs = new Date(scheduledAt).getTime() - now.getTime();
  return diffMs > CANCEL_THRESHOLD_HOURS * 60 * 60 * 1000;
}
