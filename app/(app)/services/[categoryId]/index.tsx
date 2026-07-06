import React, { useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { colors, radius, spacing, typography } from '../../../../src/design/tokens';
import { useServiceDetail, useServiceProviders } from '../../../../src/hooks/useServices';
import { ScreenHeader } from '../../../../src/components/navigation/ScreenHeader';

export default function ServiceDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { categoryId, providerId } = useLocalSearchParams<{
    categoryId: string;
    providerId?: string;
  }>();

  const providersQuery = useServiceProviders(categoryId, Boolean(categoryId) && !providerId);
  const providers = providersQuery.data ?? [];
  const needsProviderChoice = !providerId && !providersQuery.isPending && providers.length > 1;
  const resolvedProviderId = providerId ?? (providers.length === 1 ? providers[0].id : undefined);

  useEffect(() => {
    if (needsProviderChoice) {
      router.replace(`/(app)/services/${categoryId}/providers`);
    }
  }, [needsProviderChoice, categoryId, router]);

  const detailQuery = useServiceDetail(
    categoryId,
    providersQuery.isPending ? undefined : resolvedProviderId,
  );
  const detail = detailQuery.data;

  if (needsProviderChoice) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe} testID="services.detail.redirecting" />
    );
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader
        title={detail?.name ?? 'Detalle de servicio'}
        onBack={() => router.back()}
        testID="services.detail"
      />

      {detailQuery.isPending ? (
        <View style={styles.stateWrap} testID="services.detail.loading">
          <Text style={styles.stateText}>Cargando…</Text>
        </View>
      ) : detailQuery.isError || !detail ? (
        <View style={styles.stateWrap} testID="services.detail.error">
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textMuted} />
          <Text style={styles.stateText}>Algo salió mal</Text>
          <Pressable onPress={(): void => void detailQuery.refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} testID="services.detail.content">
          {detail.imageUrl ? (
            <Image source={{ uri: detail.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroFallback]}>
              <Ionicons name="storefront-outline" size={32} color={colors.textMuted} />
            </View>
          )}

          <Text style={styles.name}>{detail.name}</Text>
          {detail.providerName ? (
            <Text style={styles.providerName}>{detail.providerName}</Text>
          ) : null}
          {detail.description ? <Text style={styles.description}>{detail.description}</Text> : null}

          {detail.includes.length > 0 ? (
            <View style={styles.includesSection}>
              <Text style={styles.sectionTitle}>Incluye</Text>
              {detail.includes.map((item) => (
                <View key={item} style={styles.includeRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.includeText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={(): void =>
              router.push(
                `/(app)/services/${categoryId}/book${resolvedProviderId ? `?providerId=${resolvedProviderId}` : ''}`,
              )
            }
            style={styles.ctaButton}
            testID="services.detail.request"
          >
            <Text style={styles.ctaButtonText}>Solicitar servicio</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  heroImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.border,
  },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  name: { ...typography.heading, color: colors.textPrimary, marginTop: spacing.sm },
  providerName: { ...typography.body, color: colors.textSecondary },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  includesSection: { marginTop: spacing.md, gap: spacing.xs },
  sectionTitle: { ...typography.bodyStrong, color: colors.textPrimary, marginBottom: spacing.xxs },
  includeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  includeText: { ...typography.body, color: colors.textPrimary },
  ctaButton: {
    marginTop: spacing.lg,
    borderRadius: radius.button,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  ctaButtonText: { ...typography.button, color: colors.white },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stateText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  retryButton: {
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
  },
  retryButtonText: { ...typography.button, color: colors.white },
});
