import type { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

/** Las 4 categorías de servicio del MVP (PRD §6.1). */
export const serviceCategoryKeySchema = z.enum(['grooming', 'vet', 'walk', 'kibble']);
export type ServiceCategoryKey = z.infer<typeof serviceCategoryKeySchema>;

export const CATEGORY_LABELS: Record<ServiceCategoryKey, string> = {
  grooming: 'Grooming',
  vet: 'Veterinario',
  walk: 'Paseo',
  kibble: 'Croquetas',
};

export const CATEGORY_DESCRIPTIONS: Record<ServiceCategoryKey, string> = {
  grooming: 'Baño y corte',
  vet: 'Consultas y más',
  walk: 'Paseos y cuidados',
  kibble: 'A domicilio',
};

export const CATEGORY_ICONS: Record<ServiceCategoryKey, keyof typeof Ionicons.glyphMap> = {
  grooming: 'cut-outline',
  vet: 'medkit-outline',
  walk: 'walk-outline',
  kibble: 'bag-handle-outline',
};

export const serviceCategorySchema = z.object({
  id: z.string(),
  key: serviceCategoryKeySchema,
  name: z.string(),
  description: z.string(),
});
export type ServiceCategory = z.infer<typeof serviceCategorySchema>;

export const serviceProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().nullable().optional(),
  distanceKm: z.number().nullable().optional(),
  rating: z.number().nullable().optional(),
});
export type ServiceProvider = z.infer<typeof serviceProviderSchema>;

export const kibbleProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceLabel: z.string().nullable().optional(),
});
export type KibbleProduct = z.infer<typeof kibbleProductSchema>;

export const serviceDetailSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  categoryKey: serviceCategoryKeySchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  includes: z.array(z.string()).default([]),
  providerId: z.string().nullable().optional(),
  providerName: z.string().nullable().optional(),
  /** Horarios disponibles próximos (ISO), para el selector de cita. No aplica a Croquetas. */
  availableSlots: z.array(z.string()).default([]),
  /** Subconjunto de availableSlots ya tomado por otro usuario; se muestran deshabilitados. */
  occupiedSlots: z.array(z.string()).default([]),
  /** Ventanas de entrega estimadas (solo Croquetas), ej. "Hoy 4-7pm". */
  deliveryWindows: z.array(z.string()).default([]),
  products: z.array(kibbleProductSchema).default([]),
});
export type ServiceDetail = z.infer<typeof serviceDetailSchema>;

/** Croquetas y Paseo son "a domicilio": requieren dirección de entrega (PRD §6.3). */
export function isHomeDeliveryCategory(key: ServiceCategoryKey): boolean {
  return key === 'kibble' || key === 'walk';
}

/** Croquetas no aplica selección de mascota (PRD §6.3). */
export function requiresPetSelection(key: ServiceCategoryKey): boolean {
  return key !== 'kibble';
}

/** Croquetas usa carrito + ventana de entrega en vez de cita con fecha/hora (PRD §6.3). */
export function usesCart(key: ServiceCategoryKey): boolean {
  return key === 'kibble';
}
