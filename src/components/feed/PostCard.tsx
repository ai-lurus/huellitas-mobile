import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Post } from '../../domain/posts';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';
import { formatRelativeTime } from '../../utils/date.utils';
import { LikeButton } from './LikeButton';

interface PostCardProps {
  post: Post;
  onPress: () => void;
  onLike: () => void;
  isLiking?: boolean;
  currentUserId?: string;
}

export function PostCard({
  post,
  onPress,
  onLike,
  isLiking,
  currentUserId,
}: PostCardProps): React.JSX.Element {
  const isOwn = currentUserId === post.userId;

  return (
    <Pressable style={styles.card} onPress={onPress} testID={`post-card-${post.id}`}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {post.authorAvatar ? (
            <Image source={{ uri: post.authorAvatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-circle" size={36} color={colors.border} />
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.authorName} numberOfLines={1}>
            {post.authorName ?? 'Usuario'}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.time}>{formatRelativeTime(post.createdAt)}</Text>
            {post.locationLabel ? (
              <>
                <Text style={styles.dot}>·</Text>
                <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                <Text style={styles.location} numberOfLines={1}>
                  {post.locationLabel}
                </Text>
              </>
            ) : null}
          </View>
        </View>
        {isOwn ? (
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
        ) : null}
      </View>

      {post.content ? (
        <Text style={styles.content} numberOfLines={4}>
          {post.content}
        </Text>
      ) : null}

      {post.coverPhotoUrl ? (
        <Image
          source={{ uri: post.coverPhotoUrl }}
          style={styles.photo}
          resizeMode="cover"
          testID={`post-card-${post.id}-photo`}
        />
      ) : null}

      <View style={styles.actions}>
        <LikeButton
          liked={post.likedByMe}
          count={post.likeCount}
          onPress={onLike}
          disabled={isLiking}
        />
        <Pressable
          style={styles.commentBtn}
          onPress={onPress}
          testID={`post-card-${post.id}-comments`}
        >
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.commentCount}>{post.commentCount}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  meta: {
    flex: 1,
  },
  authorName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dot: {
    ...typography.caption,
    color: colors.textMuted,
  },
  location: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
  },
  content: {
    ...typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    lineHeight: 20,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  commentCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
