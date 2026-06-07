import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Comment } from '../../../src/domain/posts';
import { colors, spacing, typography } from '../../../src/design/tokens';
import { formatRelativeTime } from '../../../src/utils/date.utils';
import { CommentInput } from '../../../src/components/feed/CommentInput';
import { CommentItem } from '../../../src/components/feed/CommentItem';
import { LikeButton } from '../../../src/components/feed/LikeButton';
import {
  usePostDetail,
  useComments,
  useAddComment,
  useDeleteComment,
} from '../../../src/hooks/usePost';
import { useToggleLike } from '../../../src/hooks/useFeed';
import { useAuthStore } from '../../../src/stores/authStore';

export default function PostDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);

  const postQuery = usePostDetail(id);
  const commentsQuery = useComments(id);
  const { mutate: toggleLike, isPending: isLiking } = useToggleLike();
  const { mutate: addComment, isPending: isCommenting } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();

  const post = postQuery.data;

  const allComments = useMemo(
    () => commentsQuery.data?.pages.flatMap((p) => p.comments) ?? [],
    [commentsQuery.data],
  );

  const handleLike = useCallback((): void => {
    if (!post) return;
    toggleLike({ postId: post.id, liked: post.likedByMe });
  }, [post, toggleLike]);

  const handleComment = useCallback(
    (content: string): void => {
      if (!id) return;
      addComment({ postId: id, content });
    },
    [id, addComment],
  );

  const handleDeleteComment = useCallback(
    (commentId: string): void => {
      if (!id) return;
      deleteComment({ postId: id, commentId });
    },
    [id, deleteComment],
  );

  const renderComment = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem comment={item} currentUserId={currentUser?.id} onDelete={handleDeleteComment} />
    ),
    [currentUser?.id, handleDeleteComment],
  );

  if (postQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Publicación no encontrada</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const ListHeader = (
    <View>
      <View style={styles.postHeader}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            {post.authorAvatar ? (
              <Image source={{ uri: post.authorAvatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person-circle" size={40} color={colors.border} />
            )}
          </View>
          <View>
            <Text style={styles.authorName}>{post.authorName ?? 'Usuario'}</Text>
            <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </View>
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {post.coverPhotoUrl ? (
        <Image source={{ uri: post.coverPhotoUrl }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <View style={styles.postActions}>
        <LikeButton
          liked={post.likedByMe}
          count={post.likeCount}
          onPress={handleLike}
          disabled={isLiking || !currentUser}
        />
        <View style={styles.commentCount}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.commentCountText}>{post.commentCount}</Text>
        </View>
      </View>

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comentarios</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <FlatList
        data={allComments}
        keyExtractor={(c) => c.id}
        renderItem={renderComment}
        ListHeaderComponent={ListHeader}
        onEndReached={() => {
          if (commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) {
            void commentsQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          commentsQuery.isLoading ? null : (
            <Text style={styles.emptyComments}>Sé el primero en comentar</Text>
          )
        }
      />
      {currentUser ? <CommentInput onSubmit={handleComment} isSubmitting={isCommenting} /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  backLink: {
    ...typography.label,
    color: colors.primary,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  backBtn: {
    padding: spacing.xxs,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    ...typography.body,
    color: colors.textPrimary,
    padding: spacing.md,
    lineHeight: 22,
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  commentCountText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  commentsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentsTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  emptyComments: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
