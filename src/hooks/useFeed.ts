import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseInfiniteQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { FeedPage, Post } from '../domain/posts';
import { postsService } from '../services/postsService';

export const FEED_QUERY_KEY = 'feed';

export function useFeed(params: {
  lat?: number;
  lng?: number;
  radius?: number;
  enabled?: boolean;
}): UseInfiniteQueryResult<{ pages: FeedPage[] }> {
  return useInfiniteQuery({
    queryKey: [FEED_QUERY_KEY, params.lat, params.lng, params.radius],
    queryFn: ({ pageParam }) =>
      postsService.getFeed({
        lat: params.lat,
        lng: params.lng,
        radius: params.radius,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
    enabled: params.enabled !== false,
    staleTime: 60 * 1000,
  });
}

export function useUserFeed(params: {
  userId: string;
  enabled?: boolean;
}): UseInfiniteQueryResult<{ pages: FeedPage[] }> {
  return useInfiniteQuery({
    queryKey: [FEED_QUERY_KEY, 'user', params.userId],
    queryFn: ({ pageParam }) =>
      postsService.getUserPosts(params.userId, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: FeedPage) => lastPage.nextCursor ?? undefined,
    enabled: params.enabled !== false && Boolean(params.userId),
    staleTime: 60 * 1000,
  });
}

export function useDeletePost(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postsService.deletePost(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}

export function useToggleLike(): UseMutationResult<
  { likeCount: number },
  Error,
  { postId: string; liked: boolean }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked ? postsService.unlike(postId) : postsService.like(postId),
    onMutate: async ({ postId, liked }) => {
      await queryClient.cancelQueries({ queryKey: [FEED_QUERY_KEY] });
      const previousData = queryClient.getQueriesData({ queryKey: [FEED_QUERY_KEY] });

      queryClient.setQueriesData(
        { queryKey: [FEED_QUERY_KEY] },
        (old: { pages: FeedPage[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p: Post) =>
                p.id === postId
                  ? {
                      ...p,
                      likedByMe: !liked,
                      likeCount: liked ? p.likeCount - 1 : p.likeCount + 1,
                    }
                  : p,
              ),
            })),
          };
        },
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}
