import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { Group, GroupsResponse } from '../domain/groups';
import { groupsService } from '../services/groupsService';

export const GROUPS_QUERY_KEY = 'groups';

export function useGroups(params: {
  lat?: number;
  lng?: number;
  enabled?: boolean;
}): UseQueryResult<GroupsResponse> {
  return useQuery({
    queryKey: [GROUPS_QUERY_KEY, params.lat, params.lng],
    queryFn: () => groupsService.getMyGroups({ lat: params.lat, lng: params.lng }),
    enabled: params.enabled !== false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupDetail(id: string): UseQueryResult<Group> {
  return useQuery({
    queryKey: [GROUPS_QUERY_KEY, id],
    queryFn: () => groupsService.getById(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useJoinGroup(): UseMutationResult<Group, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsService.join(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [GROUPS_QUERY_KEY] });
    },
  });
}

export function useLeaveGroup(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsService.leave(groupId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [GROUPS_QUERY_KEY] });
    },
  });
}
