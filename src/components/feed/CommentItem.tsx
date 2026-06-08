import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Comment } from '../../domain/posts';
import { colors, radius, spacing, typography } from '../../design/tokens';
import { formatRelativeTime } from '../../utils/date.utils';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
}

export function CommentItem({
  comment,
  currentUserId,
  onDelete,
}: CommentItemProps): React.JSX.Element {
  const isOwn = currentUserId === comment.userId;

  return (
    <View style={styles.container} testID={`comment-${comment.id}`}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={32} color={colors.border} />
      </View>
      <View style={styles.bubble}>
        <View style={styles.header}>
          <Text style={styles.author}>{comment.authorName ?? 'Usuario'}</Text>
          <Text style={styles.time}>{formatRelativeTime(comment.createdAt)}</Text>
        </View>
        <Text style={styles.content}>{comment.content}</Text>
      </View>
      {isOwn && onDelete ? (
        <Pressable
          onPress={() => onDelete(comment.id)}
          style={styles.deleteBtn}
          testID={`comment-${comment.id}-delete`}
        >
          <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  avatar: {
    marginTop: 2,
  },
  bubble: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  author: {
    ...typography.label,
    color: colors.textPrimary,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  content: {
    ...typography.body,
    color: colors.textPrimary,
  },
  deleteBtn: {
    padding: spacing.xxs,
    marginTop: spacing.xxs,
  },
});
