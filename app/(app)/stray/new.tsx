import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { StrayForm } from '../../../src/components/stray/StrayForm';
import { colors, spacing, typography } from '../../../src/design/tokens';
import { useCreateStrayReport } from '../../../src/hooks/useStrayReports';
import { useLocationStore } from '../../../src/stores/locationStore';
import { DEFAULT_MAP_FALLBACK } from '../../../src/config/constants';

export default function NewStrayReportScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const location = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const createMutation = useCreateStrayReport();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Vi un animal suelto</Text>
        <Text style={styles.subtitle}>
          Ayuda a identificarlo. Si hay un dueño buscándolo, lo notificaremos.
        </Text>
      </View>

      <StrayForm
        lat={location.lat}
        lng={location.lng}
        isSubmitting={createMutation.isPending}
        onSubmit={(input) => {
          createMutation.mutate(input, {
            onSuccess: (report) => {
              router.replace(`/(app)/stray/${report.id}`);
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  header: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  title: { ...typography.heading, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary },
});
