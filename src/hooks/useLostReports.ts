import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { LostReport } from '../domain/lostReports';
import {
  reportsService,
  type CreateLostReportDto,
  type CreateLostReportResult,
  type NearbyLostReportsParams,
} from '../services/reportsService';

/** Alineado con `usePets` para invalidar lista y detalle al crear un reporte. */
const PETS_QUERY_KEY = ['pets'] as const;
const petQueryKey = (id: string): readonly [string, string] => ['pets', id];

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

export function useCreateLostReportMutation(
  petId: string,
): UseMutationResult<CreateLostReportResult, Error, CreateLostReportDto> {
  const queryClient = useQueryClient();
  return useMutation<CreateLostReportResult, Error, CreateLostReportDto>({
    mutationFn: (body: CreateLostReportDto) => reportsService.createLostReport(petId, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [LOST_REPORTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: PETS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: petQueryKey(petId) }),
      ]);
    },
  });
}
