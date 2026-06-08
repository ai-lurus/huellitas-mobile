import { useInfiniteQuery, type UseInfiniteQueryResult } from '@tanstack/react-query';

import type { FeedPage } from '../domain/posts';
import { groupsService } from '../services/groupsService';

export const GROUP_FEED_QUERY_KEY = 'group-feed';

export function useGroupFeed(params: {
  groupId: string;
  enabled?: boolean;
}): UseInfiniteQueryResult<{ pages: FeedPage[] }> {
  return useInfiniteQuery({
    queryKey: [GROUP_FEED_QUERY_KEY, params.groupId],
    queryFn: ({ pageParam }) =>
      groupsService.getGroupFeed(params.groupId, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
    enabled: params.enabled !== false && Boolean(params.groupId),
    staleTime: 60 * 1000,
  });
}
