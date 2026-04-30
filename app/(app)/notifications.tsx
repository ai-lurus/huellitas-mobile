import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import type { InboxNotification } from '../../src/domain/inboxNotifications';
import {
  useClearInboxMutation,
  useInboxNotifications,
  useMarkAllInboxReadMutation,
  useMarkInboxReadMutation,
  useRemoveInboxNotificationMutation,
} from '../../src/hooks/useInboxNotifications';
import { colors, radius, shadows, spacing, typography } from '../../src/design/tokens';

type TabKey = 'all' | 'unread';

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function sectionForDate(iso: string): 'HOY' | 'AYER' | 'ANTERIORES' {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'ANTERIORES';
  const now = new Date();
  if (isSameDay(d, now)) return 'HOY';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(d, y)) return 'AYER';
  return 'ANTERIORES';
}

function timeAgoLabel(iso: string): string {
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime())) return 'hace 1 min';
  const diff = Math.max(0, Date.now() - createdAt.getTime());
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

function accentForKind(kind: InboxNotification['kind']): {
  strip: string;
  icon: keyof typeof Ionicons.glyphMap;
} {
  if (kind === 'sighting') return { strip: '#3B82F6', icon: 'eye' };
  if (kind === 'lost') return { strip: colors.navActive, icon: 'location' };
  if (kind === 'resolved') return { strip: colors.success, icon: 'checkmark-circle' };
  if (kind === 'reminder') return { strip: '#9CA3AF', icon: 'alert-circle' };
  return { strip: '#F59E0B', icon: 'notifications' };
}

function TabPill({
  active,
  label,
  onPress,
  testID,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  testID: string;
}): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={[styles.tabPill, active ? styles.tabPillActive : styles.tabPillInactive]}
    >
      <Text
        style={[styles.tabPillText, active ? styles.tabPillTextActive : styles.tabPillTextInactive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function NotificationRow({
  item,
  onPress,
  onDelete,
}: {
  item: InboxNotification;
  onPress: () => void;
  onDelete: () => void;
}): React.JSX.Element {
  const accent = accentForKind(item.kind);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowCard, pressed ? styles.rowPressed : null]}
      testID={`notifications.item.${item.id}`}
    >
      <View style={[styles.rowStrip, { backgroundColor: accent.strip }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowAvatar}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name={accent.icon} size={16} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.body ? (
            <Text style={styles.rowSubtitle} numberOfLines={2}>
              {item.body}
            </Text>
          ) : null}
          <Text style={styles.rowTime}>{timeAgoLabel(item.createdAt)}</Text>
        </View>

        <View style={styles.rowRight}>
          {!item.isRead ? (
            <View style={styles.unreadDot} />
          ) : (
            <View style={styles.unreadDotSpacer} />
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onDelete}
            hitSlop={10}
            style={styles.trashBtn}
            testID={`notifications.item.${item.id}.delete`}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen(): React.JSX.Element {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('all');

  const inboxQuery = useInboxNotifications();
  const markAllRead = useMarkAllInboxReadMutation();
  const clearAll = useClearInboxMutation();
  const removeOne = useRemoveInboxNotificationMutation();
  const markRead = useMarkInboxReadMutation();

  const all = useMemo(() => inboxQuery.data ?? [], [inboxQuery.data]);
  const unreadCount = useMemo(() => all.filter((x) => !x.isRead).length, [all]);

  const visible = useMemo(() => {
    if (tab === 'unread') return all.filter((x) => !x.isRead);
    return all;
  }, [all, tab]);

  const sections = useMemo(() => {
    const grouped: Record<'HOY' | 'AYER' | 'ANTERIORES', InboxNotification[]> = {
      HOY: [],
      AYER: [],
      ANTERIORES: [],
    };
    for (const n of visible) {
      grouped[sectionForDate(n.createdAt)].push(n);
    }
    return grouped;
  }, [visible]);

  const onPressItem = useCallback(
    async (item: InboxNotification): Promise<void> => {
      if (!item.isRead) {
        await markRead.mutateAsync(item.id).catch(() => {});
      }
      if (item.reportId) {
        router.push(`/(app)/reports/${item.reportId}`);
      }
    },
    [markRead, router],
  );

  const onDeleteItem = useCallback(
    (id: string): void => {
      void removeOne.mutateAsync(id).catch(() => {});
    },
    [removeOne],
  );

  const onClearAll = useCallback((): void => {
    Alert.alert('Borrar todas', '¿Quieres borrar todas las notificaciones?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: (): void => {
          void clearAll.mutateAsync().catch(() => {});
        },
      },
    ]);
  }, [clearAll]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="notifications.back"
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void markAllRead.mutateAsync().catch(() => {})}
            style={styles.iconBtn}
            testID="notifications.markAllRead"
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClearAll}
            style={styles.iconBtn}
            testID="notifications.clearAll"
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsRow}>
        <TabPill
          active={tab === 'all'}
          label={`Todas (${all.length})`}
          onPress={() => setTab('all')}
          testID="notifications.tab.all"
        />
        <TabPill
          active={tab === 'unread'}
          label={`No leídas (${unreadCount})`}
          onPress={() => setTab('unread')}
          testID="notifications.tab.unread"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} testID="notifications.screen">
        {(['HOY', 'AYER', 'ANTERIORES'] as const).map((key) => {
          const items = sections[key];
          if (!items || items.length === 0) return null;
          return (
            <View key={key} style={styles.section}>
              <Text style={styles.sectionTitle}>{key}</Text>
              <View style={styles.sectionList}>
                {items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onPress={() => void onPressItem(item)}
                    onDelete={() => onDeleteItem(item.id)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.footerHint}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.footerHintText}>
            Puedes configurar tus preferencias de notificaciones en Ajustes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const BG = '#E9E9EA';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  tabPill: {
    borderRadius: radius.full,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  tabPillActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabPillInactive: { backgroundColor: '#D6D7DB', borderColor: 'transparent' },
  tabPillText: { ...typography.caption, fontWeight: '700' },
  tabPillTextActive: { color: colors.white },
  tabPillTextInactive: { color: colors.textPrimary },

  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionList: { gap: spacing.sm },

  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  rowPressed: { opacity: 0.92 },
  rowStrip: { width: 4, position: 'absolute', left: 0, top: 0, bottom: 0 },
  rowBody: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.md + 4,
  },
  rowAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#ECEFF5',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  rowSubtitle: { ...typography.caption, color: colors.textSecondary, lineHeight: 16 },
  rowTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  rowRight: { alignItems: 'flex-end', justifyContent: 'space-between' },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  unreadDotSpacer: { width: 10, height: 10 },
  trashBtn: { padding: 2 },

  footerHint: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerHintText: { ...typography.caption, color: colors.textMuted, flex: 1 },
});
