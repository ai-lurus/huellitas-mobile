import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Post } from '../../../src/domain/posts';
import { GroupHeader } from '../../../src/components/groups/GroupHeader';
import { PostCard } from '../../../src/components/feed/PostCard';
import { colors, shadows, spacing, typography } from '../../../src/design/tokens';
import { useGroupDetail, useJoinGroup, useLeaveGroup } from '../../../src/hooks/useGroups';
import { useGroupFeed } from '../../../src/hooks/useGroupFeed';
import { useToggleLike } from '../../../src/hooks/useFeed';
import { useAuthStore } from '../../../src/stores/authStore';

export default function GroupDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.user);

  const groupQuery = useGroupDetail(id);
  const feedQuery = useGroupFeed({ groupId: id });
  const { mutate: joinGroup, isPending: isJoining } = useJoinGroup();
  const { mutate: leaveGroup, isPending: isLeaving } = useLeaveGroup();
  const { mutate: toggleLike, isPending: isLiking } = useToggleLike();

  const group = groupQuery.data;

  const allPosts = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.posts) ?? [],
    [feedQuery.data],
  );

  const handleLike = useCallback(
    (post: Post): void => {
      toggleLike({ postId: post.id, liked: post.likedByMe });
    },
    [toggleLike],
  );

  const openPost = useCallback(
    (postId: string): void => {
      router.push(`/(app)/feed/${postId}` as Href);
    },
    [router],
  );

  const openNewPost = useCallback((): void => {
    router.push(`/(app)/feed/new-post?groupId=${id}` as Href);
  }, [router, id]);

  if (groupQuery.isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Grupo no encontrado</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const ListHeader = (
    <View>
      <GroupHeader
        group={group}
        onJoin={!group.isMember ? (): void => joinGroup(id) : undefined}
        onLeave={group.isMember ? (): void => leaveGroup(id) : undefined}
        isLoading={isJoining || isLeaving}
      />
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Publicaciones</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <FlatList<Post>
        data={allPosts}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() => openPost(item.id)}
            onLike={() => handleLike(item)}
            isLiking={isLiking}
            currentUserId={currentUser?.id}
          />
        )}
        onEndReached={() => {
          if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
            void feedQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        refreshing={Boolean(feedQuery.isRefetching || groupQuery.isRefetching)}
        onRefresh={() => {
          void feedQuery.refetch();
          void groupQuery.refetch();
        }}
        ListEmptyComponent={
          feedQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <Text style={styles.emptyFeed}>
              Aún no hay publicaciones en este grupo.{'\n'}¡Sé el primero en publicar!
            </Text>
          )
        }
      />

      {group.isMember && currentUser ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + spacing.md }]}
          onPress={openNewPost}
        >
          <Text style={styles.fabIcon}>+</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
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
  feedHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  feedTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: spacing.xxxl + 60,
  },
  emptyFeed: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    lineHeight: 32,
  },
});
