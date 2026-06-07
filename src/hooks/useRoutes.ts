import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { Route } from '../domain/routes';
import { routesService } from '../services/routesService';

export const ROUTES_QUERY_KEY = 'routes';

export function useNearbyRoutes(params: {
  lat: number;
  lng: number;
  radius: number;
  difficulty?: string;
  offLeash?: boolean;
  enabled?: boolean;
}): UseQueryResult<Route[]> {
  return useQuery({
    queryKey: [
      ROUTES_QUERY_KEY,
      params.lat,
      params.lng,
      params.radius,
      params.difficulty,
      params.offLeash,
    ],
    queryFn: () => routesService.getNearby(params),
    enabled: params.enabled !== false,
    staleTime: 3 * 60 * 1000,
  });
}

export function useRouteDetail(id: string): UseQueryResult<Route> {
  return useQuery({
    queryKey: [ROUTES_QUERY_KEY, id],
    queryFn: () => routesService.getById(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateRoute(): UseMutationResult<
  Route,
  Error,
  Parameters<typeof routesService.create>[0]
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: routesService.create,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [ROUTES_QUERY_KEY] });
    },
  });
}

export function useRateRoute(): UseMutationResult<
  { ratingAvg: number; ratingCount: number; userRating: number },
  Error,
  { routeId: string; rating: number }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ routeId, rating }) => routesService.rate(routeId, rating),
    onSuccess: (_data, { routeId }) => {
      void queryClient.invalidateQueries({ queryKey: [ROUTES_QUERY_KEY, routeId] });
    },
  });
}
