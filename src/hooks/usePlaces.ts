import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { Place } from '../domain/places';
import { placesService } from '../services/placesService';
import type { PlaceSubmitInput } from '../validation/placeSchema';

export const PLACES_QUERY_KEY = 'places';

export function useNearbyPlaces(params: {
  lat: number;
  lng: number;
  radius: number;
  category?: string;
  enabled?: boolean;
}): UseQueryResult<Place[]> {
  return useQuery({
    queryKey: [PLACES_QUERY_KEY, params.lat, params.lng, params.radius, params.category],
    queryFn: () => placesService.getNearby(params),
    enabled: params.enabled !== false,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePlaceDetail(id: string): UseQueryResult<Place> {
  return useQuery({
    queryKey: [PLACES_QUERY_KEY, id],
    queryFn: () => placesService.getById(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreatePlace(): UseMutationResult<Place, Error, PlaceSubmitInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaceSubmitInput) => placesService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PLACES_QUERY_KEY] });
    },
  });
}

export function useUpvotePlace(): UseMutationResult<
  number,
  Error,
  { placeId: string; currentlyUpvoted: boolean }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ placeId, currentlyUpvoted }) =>
      currentlyUpvoted ? placesService.removeUpvote(placeId) : placesService.upvote(placeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [PLACES_QUERY_KEY] });
    },
  });
}
