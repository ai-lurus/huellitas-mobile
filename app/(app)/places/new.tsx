import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PlaceForm } from '../../../src/components/places/PlaceForm';
import { ScreenHeader } from '../../../src/components/navigation/ScreenHeader';
import { colors } from '../../../src/design/tokens';
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
      <ScreenHeader
        title="Agregar lugar pet-friendly"
        onBack={() => router.back()}
        testID="new-place"
      />

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
});
