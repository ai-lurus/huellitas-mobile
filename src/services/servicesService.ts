import {
  serviceCategorySchema,
  serviceDetailSchema,
  serviceProviderSchema,
  type ServiceCategory,
  type ServiceDetail,
  type ServiceProvider,
} from '../domain/services';
import { bookingSchema, type Booking } from '../domain/bookings';
import { httpClient } from '../network';

function asRecord(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null;
}

function extractData(res: unknown): unknown {
  const r = asRecord(res);
  return r?.['data'] ?? r;
}

async function getCatalog(): Promise<ServiceCategory[]> {
  const res = await httpClient.get('/api/v1/service-categories');
  const data = extractData(res);
  if (!Array.isArray(data)) return [];
  return data
    .map((raw) => serviceCategorySchema.safeParse(raw))
    .filter((p): p is { success: true; data: ServiceCategory } => p.success)
    .map((p) => p.data);
}

async function getProviders(categoryId: string): Promise<ServiceProvider[]> {
  const res = await httpClient.get(
    `/api/v1/service-categories/${encodeURIComponent(categoryId)}/providers`,
  );
  const data = extractData(res);
  if (!Array.isArray(data)) return [];
  return data
    .map((raw) => serviceProviderSchema.safeParse(raw))
    .filter((p): p is { success: true; data: ServiceProvider } => p.success)
    .map((p) => p.data);
}

async function getServiceDetail(categoryId: string, providerId?: string): Promise<ServiceDetail> {
  const query = providerId ? `?providerId=${encodeURIComponent(providerId)}` : '';
  const res = await httpClient.get(
    `/api/v1/service-categories/${encodeURIComponent(categoryId)}/detail${query}`,
  );
  return serviceDetailSchema.parse(extractData(res));
}

export interface CreateBookingDto {
  serviceId: string;
  providerId?: string;
  petId?: string;
  scheduledAt?: string;
  address?: string;
  cart?: { productId: string; quantity: number }[];
}

async function createBooking(dto: CreateBookingDto): Promise<Booking> {
  const res = await httpClient.post('/api/v1/bookings', {
    serviceId: dto.serviceId,
    ...(dto.providerId ? { providerId: dto.providerId } : {}),
    ...(dto.petId ? { petId: dto.petId } : {}),
    ...(dto.scheduledAt ? { scheduledAt: dto.scheduledAt } : {}),
    ...(dto.address ? { address: dto.address } : {}),
    ...(dto.cart && dto.cart.length > 0 ? { cart: dto.cart } : {}),
  });
  return bookingSchema.parse(extractData(res));
}

async function getMyBookings(): Promise<Booking[]> {
  const res = await httpClient.get('/api/v1/bookings');
  const data = extractData(res);
  if (!Array.isArray(data)) return [];
  return data
    .map((raw) => bookingSchema.safeParse(raw))
    .filter((p): p is { success: true; data: Booking } => p.success)
    .map((p) => p.data);
}

async function cancelBooking(bookingId: string): Promise<Booking> {
  const res = await httpClient.patch(`/api/v1/bookings/${encodeURIComponent(bookingId)}`, {
    status: 'cancelled',
  });
  return bookingSchema.parse(extractData(res));
}

export const servicesService = {
  getCatalog,
  getProviders,
  getServiceDetail,
  createBooking,
  getMyBookings,
  cancelBooking,
};
