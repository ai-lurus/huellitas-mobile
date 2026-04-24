import React, { useCallback } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PetCard, PetCardSkeleton } from '../../../src/components/pets/PetCard';
import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';
import { usePets } from '../../../src/hooks/usePets';
import { MAX_PETS_PER_USER } from '../../../src/services/petsService';

import BRAND_LOGO from '../../../assets/icon.png';

const FAB_OFFSET = 88;

export default function PetsScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { petsQuery } = usePets();
  const pets = petsQuery.data ?? [];
  const count = pets.length;
  const isLoading = petsQuery.isPending;
  const isEmpty = !isLoading && count === 0;
  const remaining = Math.max(0, MAX_PETS_PER_USER - count);

  const onFabPress = useCallback((): void => {
    if (count >= MAX_PETS_PER_USER) {
      router.push('/(app)/pets/limit');
      return;
    }
    router.push('/(app)/pets/new');
  }, [count, router]);

  const openPet = useCallback(
    (id: string) => {
      router.push(`/(app)/pets/${id}`);
    },
    [router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Image
            source={BRAND_LOGO}
            style={styles.brandLogo}
            accessibilityLabel="Logo de Huellitas"
          />
          <Text style={styles.title}>Mis mascotas</Text>
        </View>
        {!isEmpty ? (
          <Text style={styles.counter}>
            {count} de {MAX_PETS_PER_USER}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={() => <PetCardSkeleton />}
        />
      ) : isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.pawOuter}>
            <View style={styles.pawInner}>
              <Image
                source={BRAND_LOGO}
                style={styles.emptyStateLogo}
                resizeMode="contain"
                accessibilityLabel="Logo de Huellitas"
              />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Add your first pet</Text>
          <Text style={styles.emptySubtitle}>
            Crea la tarjeta de tu mascota para mantener su info al día.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={petsQuery.isFetching}
              onRefresh={() => void petsQuery.refetch()}
            />
          }
          ListFooterComponent={
            count < MAX_PETS_PER_USER ? (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={22} color={colors.iconMuted} />
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoTitle}>
                    {remaining === 1
                      ? 'Puedes agregar 1 mascota más'
                      : `Puedes agregar ${remaining} mascotas más`}
                  </Text>
                  <Text style={styles.infoSub}>Límite máximo: {MAX_PETS_PER_USER} mascotas</Text>
                </View>
              </View>
            ) : (
              <View style={styles.limitBanner}>
                <Text style={styles.limitBannerText}>
                  Has alcanzado el máximo de {MAX_PETS_PER_USER} mascotas. Elimina una para agregar
                  otra.
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => <PetCard pet={item} onPress={() => openPet(item.id)} />}
        />
      )}

      <Pressable
        testID="pets.add"
        style={[styles.fab, { bottom: insets.bottom + FAB_OFFSET }]}
        onPress={onFabPress}
        accessibilityRole="button"
        accessibilityLabel="Agregar mascota"
      >
        <Ionicons name="add" size={30} color={colors.white} />
      </Pressable>
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
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
  },
  title: { color: colors.textPrimary, ...typography.heading, flexShrink: 1 },
  counter: { color: colors.textSecondary, ...typography.caption, fontWeight: '600' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
    paddingTop: spacing.xs,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  pawOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#FFE8D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  pawInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFF1E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyStateLogo: {
    width: 64,
    height: 64,
  },
  emptyTitle: { color: colors.textPrimary, ...typography.heading, textAlign: 'center' },
  emptySubtitle: {
    color: colors.textSecondary,
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  infoBox: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoBackground,
  },
  infoTextCol: { flex: 1 },
  infoTitle: { color: colors.primary, ...typography.bodyStrong },
  infoSub: { color: colors.textSecondary, ...typography.caption, marginTop: 4 },
  limitBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  limitBannerText: { color: colors.dangerDark, ...typography.body },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
});
