import React, { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PetHeroCard } from '../../../src/components/pets/PetHeroCard';
import { PetCardSkeleton } from '../../../src/components/pets/PetCard';
import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import { usePets } from '../../../src/hooks/usePets';
import { useAuthStore } from '../../../src/stores/authStore';
import { MAX_PETS_PER_USER } from '../../../src/services/petsService';

export default function PetsScreen(): React.ReactElement {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { petsQuery } = usePets();
  const userName = useAuthStore((s) => s.user?.name);
  const pets = petsQuery.data ?? [];
  const count = pets.length;
  const isLoading = petsQuery.isPending;
  const hasError = petsQuery.isError && count === 0;
  const isEmpty = !isLoading && !hasError && count === 0;
  const remaining = Math.max(0, MAX_PETS_PER_USER - count);
  const atLimit = count >= MAX_PETS_PER_USER;

  const cardWidth = width - spacing.lg * 2;

  const onAddPress = useCallback((): void => {
    if (atLimit) {
      router.push('/(app)/pets/limit');
      return;
    }
    router.push('/(app)/pets/new');
  }, [atLimit, router]);

  const openPet = useCallback(
    (id: string, tab?: 'carnet' | 'rutina') => {
      router.push(tab ? `/(app)/pets/${id}?tab=${tab}` : `/(app)/pets/${id}`);
    },
    [router],
  );

  const initial = userName?.trim().charAt(0).toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mis mascotas</Text>
        <View style={styles.headerRight}>
          <View style={styles.avatar} testID="pets.userAvatar">
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={() => <PetCardSkeleton />}
        />
      ) : hasError ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>No pudimos cargar tus mascotas</Text>
          <Text style={styles.errorSubtitle}>Revisá tu conexión e intentá de nuevo.</Text>
          <Pressable
            onPress={() => void petsQuery.refetch()}
            style={styles.retryBtn}
            accessibilityRole="button"
          >
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.pawOuter}>
            <Ionicons name="paw-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes mascotas</Text>
          <Text style={styles.emptySubtitle}>
            Crea la tarjeta de tu mascota para mantener su info al día.
          </Text>
          <Pressable
            testID="pets.add.empty"
            onPress={onAddPress}
            style={styles.emptyCta}
            accessibilityRole="button"
          >
            <Text style={styles.emptyCtaText}>Agregar mi primera mascota</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={pets}
            keyExtractor={(pet) => pet.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
            renderItem={({ item: pet }) => (
              <PetHeroCard
                pet={pet}
                onPress={() => openPet(pet.id)}
                onOpenCarnet={() => openPet(pet.id, 'carnet')}
                onOpenRutina={() => openPet(pet.id, 'rutina')}
              />
            )}
          />

          <View style={[styles.addCardWrap, { width: cardWidth }]}>
            <Pressable
              testID="pets.add"
              onPress={onAddPress}
              style={styles.addCard}
              accessibilityRole="button"
              accessibilityLabel="Agregar mascota"
            >
              <View style={styles.addIconCircle}>
                <Ionicons name="add" size={22} color={colors.primary} />
              </View>
              <View style={styles.addTextCol}>
                <Text style={styles.addCardTitle}>Agregar mascota</Text>
                <Text style={styles.addCardSubtitle}>
                  {atLimit
                    ? `Has alcanzado el límite de ${MAX_PETS_PER_USER} mascotas`
                    : `Puedes agregar ${remaining} más · límite ${MAX_PETS_PER_USER}`}
                </Text>
              </View>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.textPrimary, ...typography.heading, flexShrink: 1 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, ...typography.bodyStrong, fontSize: 14 },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    paddingTop: spacing.xs,
  },
  itemSeparator: { height: spacing.md },
  list: { flex: 1 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pawOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.infoBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    color: colors.textPrimary,
    ...typography.heading,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  errorSubtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
  },
  retryBtnText: { color: colors.white, ...typography.bodyStrong },
  emptyTitle: { color: colors.textPrimary, ...typography.heading, textAlign: 'center' },
  emptySubtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  emptyCta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  emptyCtaText: { color: colors.white, ...typography.button },

  addCardWrap: { alignSelf: 'center', marginBottom: spacing.lg },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.infoBorder,
    padding: spacing.md,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.infoBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextCol: { flex: 1 },
  addCardTitle: { color: colors.textPrimary, ...typography.bodyStrong },
  addCardSubtitle: { color: colors.textSecondary, ...typography.caption, marginTop: 2 },
});
