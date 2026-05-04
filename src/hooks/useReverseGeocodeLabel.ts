import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export const REVERSE_GEOCODE_QUERY_KEY = 'reverse-geocode' as const;

function fmt(parts: (string | undefined)[]): string | null {
  const out = parts.map((p) => (p ?? '').trim()).filter((p) => p.length > 0);
  if (out.length === 0) return null;
  return out.join(', ');
}

export function useReverseGeocodeLabel(
  coords: { lat: number; lng: number } | null | undefined,
): UseQueryResult<string | null> {
  return useQuery({
    queryKey: [REVERSE_GEOCODE_QUERY_KEY, coords?.lat ?? null, coords?.lng ?? null] as const,
    enabled: Boolean(coords) && Platform.OS !== 'web',
    staleTime: 1000 * 60 * 60 * 12,
    gcTime: 1000 * 60 * 60 * 24,
    queryFn: async () => {
      if (!coords) return null;
      try {
        const res = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });
        const first = res?.[0];
        if (!first) return null;

        const district = first.district ?? first.subregion;
        const city = first.city ?? first.region;
        return (
          fmt([district, city]) ??
          fmt([first.street, first.city]) ??
          fmt([first.city, first.country]) ??
          null
        );
      } catch {
        return null;
      }
    },
  });
}
