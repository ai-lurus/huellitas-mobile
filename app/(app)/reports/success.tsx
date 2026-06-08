import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter } from 'expo-router';

import { colors, radius, shadows, spacing, typography } from '../../../src/design/tokens';

export default function ReportSuccessScreen(): React.JSX.Element {
  const router = useRouter();

  const title = useMemo(() => '¡Lo logramos!' as const, []);
  const subtitle = useMemo(
    () => 'Gracias por ayudar: tu reporte contribuyó a que la mascota sea encontrada.',
    [],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace('/(app)/pets');
    }, 3200);
    return (): void => clearTimeout(t);
  }, [router]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.root}>
        <ConfettiCannon count={180} origin={{ x: 0, y: 0 }} />

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="heart" size={26} color={colors.white} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Redirigiendo a tus mascotas…</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            testID="reports.success.goToPets"
            onPress={() => router.replace('/(app)/pets')}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Ir a mis mascotas</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  title: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.caption, color: colors.textSecondary },
  btn: {
    width: '100%',
    height: 48,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  btnText: { ...typography.button, color: colors.white },
});
