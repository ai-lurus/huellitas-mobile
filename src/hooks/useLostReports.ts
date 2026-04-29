import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { LostReport } from '../domain/lostReports';
import { reportsService, type NearbyLostReportsParams } from '../services/reportsService';

export const LOST_REPORTS_QUERY_KEY = 'lost-reports';

export function useLostReports(params: NearbyLostReportsParams): UseQueryResult<LostReport[]> {
  return useQuery({
    queryKey: [LOST_REPORTS_QUERY_KEY, params] as const,
    queryFn: () => reportsService.getNearby(params),
    enabled: Number.isFinite(params.lat) && Number.isFinite(params.lng) && params.radius > 0,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
