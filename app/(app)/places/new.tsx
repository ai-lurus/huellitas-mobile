import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { PlaceForm } from '../../../src/components/places/PlaceForm';
import { colors, spacing, typography } from '../../../src/design/tokens';
import { useCreatePlace } from '../../../src/hooks/usePlaces';
import { useLocationStore } from '../../../src/stores/locationStore';
import { DEFAULT_MAP_FALLBACK } from '../../../src/config/constants';

export default function NewPlaceScreen(): React.JSX.Element {
  const router = useRouter();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const location = currentLocation ?? DEFAULT_MAP_FALLBACK;
  const createMutation = useCreatePlace();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} testID="new-place.back">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Agregar lugar pet-friendly</Text>
        <View style={{ width: 24 }} />
      </View>

      <PlaceForm
        lat={location.lat}
        lng={location.lng}
        isSubmitting={createMutation.isPending}
        onSubmit={(values) => {
          createMutation.mutate(values, {
            onSuccess: (place) => {
              router.replace(`/(app)/places/${place.id}`);
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.backgroundApp },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.heading, color: colors.textPrimary },
});
