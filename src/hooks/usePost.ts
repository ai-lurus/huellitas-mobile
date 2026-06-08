import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseInfiniteQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import type { Post, Comment, CommentsPage } from '../domain/posts';
import { postsService } from '../services/postsService';
import { FEED_QUERY_KEY } from './useFeed';

export const POST_QUERY_KEY = 'post';
export const COMMENTS_QUERY_KEY = 'comments';

export function usePostDetail(id: string): UseQueryResult<Post> {
  return useQuery({
    queryKey: [POST_QUERY_KEY, id],
    queryFn: () => postsService.getById(id),
    enabled: Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useComments(postId: string): UseInfiniteQueryResult<{ pages: CommentsPage[] }> {
  return useInfiniteQuery({
    queryKey: [COMMENTS_QUERY_KEY, postId],
    queryFn: ({ pageParam }) => postsService.getComments(postId, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage: CommentsPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(postId),
    staleTime: 30 * 1000,
  });
}

export function useAddComment(): UseMutationResult<
  Comment,
  Error,
  { postId: string; content: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      postsService.addComment(postId, content),
    onSuccess: (_data, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, postId] });
      void queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEY, postId] });
      void queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}

export function useDeleteComment(): UseMutationResult<
  void,
  Error,
  { postId: string; commentId: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      postsService.deleteComment(postId, commentId),
    onSuccess: (_data, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, postId] });
      void queryClient.invalidateQueries({ queryKey: [POST_QUERY_KEY, postId] });
      void queryClient.invalidateQueries({ queryKey: [FEED_QUERY_KEY] });
    },
  });
}
