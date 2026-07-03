import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Booking } from '../domain/bookings';
import type { ServiceCategory, ServiceDetail, ServiceProvider } from '../domain/services';
import type { CreateBookingDto } from '../services/servicesService';
import { servicesService } from '../services/servicesService';

export const SERVICE_CATEGORIES_QUERY_KEY = ['service-categories'] as const;
export const serviceProvidersQueryKey = (categoryId: string) =>
  ['service-categories', categoryId, 'providers'] as const;
export const serviceDetailQueryKey = (categoryId: string, providerId?: string) =>
  ['service-categories', categoryId, 'detail', providerId ?? null] as const;
export const MY_BOOKINGS_QUERY_KEY = ['bookings'] as const;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useServiceCatalog() {
  return useQuery<ServiceCategory[]>({
    queryKey: SERVICE_CATEGORIES_QUERY_KEY,
    queryFn: () => servicesService.getCatalog(),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useServiceProviders(categoryId: string, enabled: boolean) {
  return useQuery<ServiceProvider[]>({
    queryKey: serviceProvidersQueryKey(categoryId),
    queryFn: () => servicesService.getProviders(categoryId),
    enabled,
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useServiceDetail(categoryId: string, providerId?: string) {
  return useQuery<ServiceDetail>({
    queryKey: serviceDetailQueryKey(categoryId, providerId),
    queryFn: () => servicesService.getServiceDetail(categoryId, providerId),
    enabled: Boolean(categoryId),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useMyBookings() {
  return useQuery<Booking[]>({
    queryKey: MY_BOOKINGS_QUERY_KEY,
    queryFn: () => servicesService.getMyBookings(),
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateBookingDto) => servicesService.createBooking(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_QUERY_KEY });
    },
  });
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => servicesService.cancelBooking(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MY_BOOKINGS_QUERY_KEY });
    },
  });
}
