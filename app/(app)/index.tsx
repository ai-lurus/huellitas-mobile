import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';

import { HomeHeader } from '../../src/components/home/HomeHeader';
import { StreakCard } from '../../src/components/home/StreakCard';
import { TasksSection } from '../../src/components/home/TasksSection';
import { RemindersSection } from '../../src/components/home/RemindersSection';
import { NearbyAlertsSection } from '../../src/components/home/NearbyAlertsSection';
import { DEFAULT_MAP_FALLBACK } from '../../src/config/constants';
import { colors, radius, shadows, spacing, typography } from '../../src/design/tokens';
import {
  buildMockHomeTasks,
  buildMockHomeReminders,
  computeMockStreakDays,
  sortHomeTasks,
  type HomeReminder,
  type HomeTask,
} from '../../src/domain/homeTasks';
import type { LostReport } from '../../src/domain/lostReports';
import { useLostReports } from '../../src/hooks/useLostReports';
import { usePets } from '../../src/hooks/usePets';
import { useLocationStore } from '../../src/stores/locationStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const alertRadiusKm = useSettingsStore((s) => s.alertRadiusKm);
  const currentUser = useAuthStore((s) => s.user);

  const raw = currentLocation ?? DEFAULT_MAP_FALLBACK;
  // Round to 3 decimal places (~110m precision) so GPS micro-updates
  // don't create new query keys and trigger unnecessary re-fetches.
  const searchCenter = {
    lat: Math.round(raw.lat * 1000) / 1000,
    lng: Math.round(raw.lng * 1000) / 1000,
  };

  const { pets: petsData, isLoading: petsLoading, petsQuery } = usePets();
  const pets = useMemo(() => petsData ?? [], [petsData]);
  const reportsQuery = useLostReports({
    lat: searchCenter.lat,
    lng: searchCenter.lng,
    radius: alertRadiusKm,
  });

  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);
  const lostCount = useMemo(() => reports.filter((r) => r.reportKind === 'lost').length, [reports]);

  const rawTasks = useMemo(() => buildMockHomeTasks(pets), [pets]);
  const [completedTaskIds, setCompletedTaskIds] = useState<ReadonlySet<string>>(new Set());
  const tasks = useMemo(() => {
    const merged = rawTasks.map((task) => ({
      ...task,
      completed: completedTaskIds.has(task.id),
    }));
    return sortHomeTasks(merged);
  }, [rawTasks, completedTaskIds]);
  const overdueCount = useMemo(
    () => tasks.filter((t) => t.overdue && !t.completed).length,
    [tasks],
  );
  const allTasksCompletedToday = tasks.length > 0 && tasks.every((t) => t.completed);
  const streakDays = useMemo(
    () => computeMockStreakDays(pets, allTasksCompletedToday),
    [pets, allTasksCompletedToday],
  );
  const reminders = useMemo(() => buildMockHomeReminders(pets), [pets]);

  const hasError = petsQuery.isError || reportsQuery.isError;
  const isInitialLoading =
    (petsLoading && pets.length === 0) ||
    (reportsQuery.fetchStatus === 'fetching' && reportsQuery.data === undefined);

  const handleRetry = useCallback((): void => {
    void petsQuery.refetch();
    void reportsQuery.refetch();
  }, [petsQuery, reportsQuery]);

  const goToPets = useCallback((): void => {
    router.push('/(app)/pets' as Href);
  }, [router]);

  const handleTaskPress = useCallback(
    (task: HomeTask): void => {
      router.push(`/(app)/pets/${task.petId}` as Href);
    },
    [router],
  );

  const handleToggleTask = useCallback((taskId: string): void => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleReminderPress = useCallback(
    (reminder: HomeReminder): void => {
      router.push(`/(app)/pets/${reminder.petId}` as Href);
    },
    [router],
  );

  const handleReportPress = useCallback(
    (report: LostReport): void => {
      router.push(`/(app)/reports/${report.id}` as Href);
    },
    [router],
  );

  const handleLevantarReporte = useCallback((): void => {
    router.push('/(app)/radar/report/new' as Href);
  }, [router]);

  const hasPets = pets.length > 0;

  return (
    <View style={styles.screen} testID="home.screen">
      <ScrollView contentContainerStyle={styles.scrollContent} testID="home.scroll">
        <HomeHeader
          userName={currentUser?.name}
          hasUnseenEvents={overdueCount > 0 || lostCount > 0}
          onSearchPress={() => {}}
          onBellPress={() => router.push('/(app)/notifications' as Href)}
        />

        {hasError && (
          <View style={styles.errorBanner} testID="home.error">
            <Text style={styles.errorText}>Algo salió mal</Text>
            <Pressable onPress={handleRetry} testID="home.error.retry">
              <Text style={styles.errorRetry}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {hasPets && <StreakCard streakDays={streakDays} />}

        <TasksSection
          isLoading={isInitialLoading}
          hasPets={hasPets}
          tasks={tasks}
          onTaskPress={handleTaskPress}
          onToggleTask={handleToggleTask}
          onAddFirstPet={() => router.push('/(app)/pets/new' as Href)}
          onSeeMore={goToPets}
        />

        <RemindersSection reminders={reminders} onReminderPress={handleReminderPress} />

        <Pressable
          style={styles.reportButton}
          onPress={handleLevantarReporte}
          testID="home.report-button"
        >
          <Ionicons name="megaphone" size={18} color={colors.white} />
          <Text style={styles.reportButtonText}>Levantar reporte</Text>
        </Pressable>

        <NearbyAlertsSection
          reports={reports}
          isLoading={isInitialLoading}
          onReportPress={handleReportPress}
          onSeeAll={() => router.push('/(app)/map' as Href)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dangerSoft,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
  },
  errorText: { ...typography.bodyStrong, color: colors.dangerDark },
  errorRetry: { ...typography.bodyStrong, color: colors.primary },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.danger,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    ...shadows.button,
  },
  reportButtonText: { ...typography.button, color: colors.white },
});
