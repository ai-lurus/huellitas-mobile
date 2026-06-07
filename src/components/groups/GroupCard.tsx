import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Group } from '../../domain/groups';
import { GROUP_TYPE_ICONS, GROUP_TYPE_LABELS } from '../../domain/groups';
import { colors, radius, shadows, spacing, typography } from '../../design/tokens';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  onJoin?: () => void;
  isJoining?: boolean;
}

export function GroupCard({
  group,
  onPress,
  onJoin,
  isJoining,
}: GroupCardProps): React.JSX.Element {
  return (
    <Pressable style={styles.card} onPress={onPress} testID={`group-card-${group.id}`}>
      <View style={styles.photoContainer}>
        {group.photoUrl ? (
          <Image source={{ uri: group.photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderEmoji}>{GROUP_TYPE_ICONS[group.type] ?? '👥'}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeLabel}>{GROUP_TYPE_LABELS[group.type]}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {group.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={13} color={colors.textMuted} />
          <Text style={styles.memberCount}>{group.memberCount} miembros</Text>
        </View>
        {group.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}
      </View>
      {!group.isMember && onJoin ? (
        <Pressable
          style={styles.joinBtn}
          onPress={onJoin}
          disabled={isJoining}
          testID={`group-card-${group.id}-join`}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.joinText}>Unirse</Text>
          )}
        </Pressable>
      ) : null}
      {group.isMember ? (
        <View style={styles.memberBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.memberText}>Miembro</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.md,
  },
  photoContainer: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: {
    width: 56,
    height: 56,
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoBackground,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.xxs + 2,
    paddingVertical: 2,
  },
  typeLabel: {
    ...typography.caption,
    color: colors.infoBorder,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  memberCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  joinBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.primary,
    minWidth: 64,
    alignItems: 'center',
  },
  joinText: {
    ...typography.label,
    color: colors.primary,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  memberText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
});
