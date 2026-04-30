import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { InboxNotification } from '../domain/inboxNotifications';
import { inboxNotificationsService } from '../services/inboxNotificationsService';

export const INBOX_NOTIFICATIONS_QUERY_KEY = ['inbox-notifications'] as const;

export function useInboxNotifications(): UseQueryResult<InboxNotification[]> {
  return useQuery({
    queryKey: INBOX_NOTIFICATIONS_QUERY_KEY,
    queryFn: () => inboxNotificationsService.list(),
    staleTime: 5_000,
  });
}

export function useMarkAllInboxReadMutation(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inboxNotificationsService.markAllRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: INBOX_NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useClearInboxMutation(): UseMutationResult<void, Error, void> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => inboxNotificationsService.clear(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: INBOX_NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useRemoveInboxNotificationMutation(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inboxNotificationsService.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: INBOX_NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkInboxReadMutation(): UseMutationResult<void, Error, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inboxNotificationsService.markRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: INBOX_NOTIFICATIONS_QUERY_KEY });
    },
  });
}
