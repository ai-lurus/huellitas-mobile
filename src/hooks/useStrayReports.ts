import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { StrayReport } from '../domain/strayReports';
import { strayService } from '../services/strayService';
import type { StrayReportSubmitInput } from '../validation/strayReportSchema';

export const STRAY_REPORTS_QUERY_KEY = 'stray-reports';

export function useNearbyStrayReports(params: {
  lat: number;
  lng: number;
  radius: number;
  enabled?: boolean;
}): UseQueryResult<StrayReport[]> {
  return useQuery({
    queryKey: [STRAY_REPORTS_QUERY_KEY, params] as const,
    queryFn: () => strayService.getNearby(params),
    enabled: (params.enabled ?? true) && Number.isFinite(params.lat) && Number.isFinite(params.lng),
    refetchInterval: 60_000,
    staleTime: 50_000,
  });
}

export function useStrayReportDetail(id: string): UseQueryResult<StrayReport> {
  return useQuery({
    queryKey: [STRAY_REPORTS_QUERY_KEY, id] as const,
    queryFn: () => strayService.getById(id),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateStrayReport(): UseMutationResult<
  StrayReport,
  Error,
  StrayReportSubmitInput
> {
  const queryClient = useQueryClient();
  return useMutation<StrayReport, Error, StrayReportSubmitInput>({
    mutationFn: (input) => strayService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [STRAY_REPORTS_QUERY_KEY] });
    },
  });
}

export function useMatchStrayReport(): UseMutationResult<
  void,
  Error,
  { strayId: string; lostReportId: string }
> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { strayId: string; lostReportId: string }>({
    mutationFn: ({ strayId, lostReportId }) =>
      strayService.matchToLostReport(strayId, lostReportId),
    onSuccess: async (_data, { strayId }) => {
      await queryClient.invalidateQueries({ queryKey: [STRAY_REPORTS_QUERY_KEY, strayId] });
    },
  });
}
