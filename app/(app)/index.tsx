import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { HomeReportCard } from '../../src/components/reports/HomeReportCard';
import { ReportCardSkeleton } from '../../src/components/reports/ReportCardSkeleton';
import { PostCard } from '../../src/components/feed/PostCard';
import { GroupChip } from '../../src/components/groups/GroupChip';
import { DEFAULT_MAP_FALLBACK } from '../../src/config/constants';
import { colors, radius, shadows, spacing, typography } from '../../src/design/tokens';
import type { LostReport } from '../../src/domain/lostReports';
import type { Post } from '../../src/domain/posts';
import { useLostReports } from '../../src/hooks/useLostReports';
import { useFeed, useToggleLike } from '../../src/hooks/useFeed';
import { useGroups } from '../../src/hooks/useGroups';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';

type HomeTab = 'comunidad' | 'alertas';
type AlertFilter = 'all' | 'lost' | 'sighted' | 'resolved';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<HomeTab>('comunidad');
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');

  const searchCenter = currentLocation ?? DEFAULT_MAP_FALLBACK;

  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const feedQuery = useFeed({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
    enabled: activeTab === 'comunidad',
  });

  const { mutate: toggleLike, isPending: isLiking } = useToggleLike();

  const groupsQuery = useGroups({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    enabled: activeTab === 'comunidad' && Boolean(currentUser),
  });
  const myGroups = useMemo(() => groupsQuery.data?.myGroups ?? [], [groupsQuery.data]);

  const allReports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);
  const filteredReports = useMemo(() => {
    if (alertFilter === 'all') return allReports;
    return allReports.filter((r) => r.reportKind === alertFilter);
  }, [allReports, alertFilter]);

  const lostCount = useMemo(
    () => allReports.filter((r) => r.reportKind === 'lost').length,
    [allReports],
  );

  const allPosts = useMemo(
    () => feedQuery.data?.pages.flatMap((p) => p.posts) ?? [],
    [feedQuery.data],
  );

  const openReport = useCallback(
    (id: string): void => {
      router.push(`/(app)/reports/${id}` as Href);
    },
    [router],
  );

  const openPost = useCallback(
    (id: string): void => {
      router.push(`/(app)/feed/${id}` as Href);
    },
    [router],
  );

  const handleLike = useCallback(
    (post: Post): void => {
      toggleLike({ postId: post.id, liked: post.likedByMe });
    },
    [toggleLike],
  );

  const topBar = (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <View style={styles.logoMark}>
          <Image
            accessibilityLabel="Huellitas"
            source={require('../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandText}>Huellitas</Text>
      </View>
      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" style={styles.actionBtn} testID="home.search">
          <Ionicons name="search" size={20} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.actionBtn}
          testID="home.notifications"
          onPress={() => router.push('/(app)/notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
          <View style={styles.dot} />
        </Pressable>
      </View>
    </View>
  );

  const tabBar = (
    <View style={styles.tabBar} testID="home.tabs">
      <Pressable
        style={[styles.tab, activeTab === 'comunidad' && styles.tabActive]}
        onPress={() => setActiveTab('comunidad')}
        testID="home.tab.comunidad"
      >
        <Text style={[styles.tabLabel, activeTab === 'comunidad' && styles.tabLabelActive]}>
          Comunidad
        </Text>
        {activeTab === 'comunidad' && <View style={styles.tabIndicator} />}
      </Pressable>
      <Pressable
        style={[styles.tab, activeTab === 'alertas' && styles.tabActive]}
        onPress={() => setActiveTab('alertas')}
        testID="home.tab.alertas"
      >
        <Text style={[styles.tabLabel, activeTab === 'alertas' && styles.tabLabelActive]}>
          Alertas
        </Text>
        {lostCount > 0 && (
          <View style={styles.alertBadge}>
            <Text style={styles.alertBadgeText}>{lostCount}</Text>
          </View>
        )}
        {activeTab === 'alertas' && <View style={styles.tabIndicator} />}
      </Pressable>
    </View>
  );

  const alertFilterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      testID="home.filters"
    >
      <FilterChip
        active={alertFilter === 'all'}
        icon="apps"
        label="Todos"
        onPress={() => setAlertFilter('all')}
        tone="purple"
        testID="home.filter.all"
      />
      <FilterChip
        active={alertFilter === 'lost'}
        icon="alert-circle"
        label="Perdidos"
        onPress={() => setAlertFilter('lost')}
        tone="lost"
        testID="home.filter.lost"
      />
      <FilterChip
        active={alertFilter === 'sighted'}
        icon="eye"
        label="Avistados"
        onPress={() => setAlertFilter('sighted')}
        tone="sighted"
        testID="home.filter.sighted"
      />
      <FilterChip
        active={alertFilter === 'resolved'}
        icon="checkmark-circle"
        label="Resueltos"
        onPress={() => setAlertFilter('resolved')}
        tone="resolved"
        testID="home.filter.resolved"
      />
    </ScrollView>
  );

  const groupsChips =
    myGroups.length > 0 ? (
      <View style={styles.groupsSection}>
        <View style={styles.groupsHeader}>
          <Text style={styles.groupsTitle}>Mis grupos</Text>
          <Pressable onPress={() => router.push('/(app)/groups' as Href)}>
            <Text style={styles.groupsSeeAll}>Ver todos</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupsScroll}
        >
          {myGroups.map((g) => (
            <GroupChip
              key={g.id}
              group={g}
              onPress={() => router.push(`/(app)/groups/${g.id}` as Href)}
            />
          ))}
        </ScrollView>
      </View>
    ) : null;

  const headerComponent = (
    <View style={styles.headerWrap}>
      <View style={styles.topBarPadded}>{topBar}</View>
      {tabBar}
      {activeTab === 'alertas' && (
        <View style={styles.alertsSubHeader}>
          {alertFilterChips}
          <View style={styles.subRow} testID="home.subtitle">
            <Text style={styles.subRed}>{lostCount} mascotas perdidas</Text>
            <Text style={styles.subMuted}> cerca de ti</Text>
          </View>
        </View>
      )}
      {activeTab === 'comunidad' && groupsChips}
    </View>
  );

  if (activeTab === 'alertas') {
    const showLoading = reportsQuery.fetchStatus === 'fetching' && reportsQuery.data === undefined;
    return (
      <View style={styles.screen} testID="home.screen">
        {showLoading ? (
          <>
            {headerComponent}
            <View style={styles.listPadding}>
              <ReportCardSkeleton />
              <ReportCardSkeleton />
            </View>
          </>
        ) : (
          <FlatList<LostReport>
            ListHeaderComponent={headerComponent}
            data={filteredReports}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            refreshing={Boolean(reportsQuery.isRefetching)}
            onRefresh={() => void reportsQuery.refetch()}
            renderItem={({ item }) => (
              <HomeReportCard report={item} onPress={() => openReport(item.id)} />
            )}
            testID="home.alerts.list"
          />
        )}
      </View>
    );
  }

  // Comunidad tab
  const showFeedLoading = feedQuery.fetchStatus === 'fetching' && feedQuery.data === undefined;

  return (
    <View style={styles.screen} testID="home.screen">
      {showFeedLoading ? (
        <>
          {headerComponent}
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        </>
      ) : (
        <FlatList<Post>
          ListHeaderComponent={headerComponent}
          data={allPosts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedPadding}
          refreshing={Boolean(feedQuery.isRefetching)}
          onRefresh={() => void feedQuery.refetch()}
          onEndReached={() => {
            if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
              void feedQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => openPost(item.id)}
              onLike={() => handleLike(item)}
              isLiking={isLiking}
              currentUserId={currentUser?.id}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyFeed}>
              Aún no hay publicaciones cerca de ti.{'\n'}¡Sé el primero en compartir!
            </Text>
          }
          testID="home.feed.list"
        />
      )}

      {currentUser ? (
        <Pressable
          style={styles.fab}
          onPress={() => router.push('/(app)/feed/new-post' as Href)}
          testID="home.fab.new-post"
        >
          <Ionicons name="add" size={28} color={colors.white} />
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
  headerWrap: {
    backgroundColor: colors.surface,
  },
  topBarPadded: {
    paddingTop: spacing.xxxl + spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertsSubHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB366',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: 26, height: 26 },
  brandText: { ...typography.heading, color: colors.textPrimary },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.backgroundApp,
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
    position: 'relative',
  },
  tabActive: {},
  tabLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  alertBadge: {
    backgroundColor: colors.danger,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  alertBadgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
    fontSize: 10,
  },

  groupsSection: {
    marginHorizontal: -spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  groupsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  groupsTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupsSeeAll: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  groupsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },

  chipsRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center' },
  subRed: { ...typography.caption, color: colors.danger, fontWeight: '800' },
  subMuted: { ...typography.caption, color: colors.textMuted },

  listPadding: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  feedPadding: {
    paddingBottom: spacing.xxxl + 60,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
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
    bottom: spacing.xl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
});

function FilterChip({
  active,
  icon,
  label,
  onPress,
  tone,
  testID,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone: 'purple' | 'lost' | 'sighted' | 'resolved';
  testID: string;
}): React.JSX.Element {
  const palette = useMemo(() => {
    if (tone === 'lost') return { activeText: colors.navActive };
    if (tone === 'sighted') return { activeText: '#2563EB' };
    if (tone === 'resolved') return { activeText: colors.success };
    return { activeText: colors.primary };
  }, [tone]);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID={testID}
      style={[
        stylesChip.chip,
        active
          ? { backgroundColor: colors.surface, borderColor: palette.activeText }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={14} color={active ? palette.activeText : colors.textMuted} />
      <Text style={[stylesChip.label, { color: active ? palette.activeText : colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const stylesChip = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  label: { ...typography.caption, fontWeight: '700' },
});
