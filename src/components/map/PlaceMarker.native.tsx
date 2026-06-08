import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Callout, Marker } from 'react-native-maps';

import type { Place } from '../../domain/places';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '../../domain/places';
import { colors, spacing, typography } from '../../design/tokens';

const CATEGORY_COLORS: Record<string, string> = {
  park: '#22C55E',
  restaurant: '#F59E0B',
  cafe: '#A78BFA',
  hotel: '#3B82F6',
  vet: '#EF4444',
  groomer: '#EC4899',
  petshop: '#14B8A6',
  beach: '#0EA5E9',
  other: '#6B7280',
};

interface PlaceMarkerProps {
  place: Place;
  onPressCallout: (placeId: string) => void;
  opacity?: number;
}

export const PlaceMarker = memo(function PlaceMarker({
  place,
  onPressCallout,
  opacity = 1,
}: PlaceMarkerProps): React.JSX.Element {
  const icon = CATEGORY_ICONS[place.category] ?? '📍';
  const label = CATEGORY_LABELS[place.category] ?? 'Lugar';
  const color = CATEGORY_COLORS[place.category] ?? '#6B7280';

  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lng }}
      identifier={`place-${place.id}`}
      testID={`place-marker.${place.id}`}
      opacity={opacity}
      tracksViewChanges={false}
    >
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Callout onPress={() => onPressCallout(place.id)} testID={`place-callout.${place.id}`}>
        <View style={styles.callout}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.category}>{label}</Text>
          {place.address ? (
            <Text style={styles.meta} numberOfLines={1}>
              {place.address}
            </Text>
          ) : null}
          <Text style={styles.votes}>👍 {place.upvoteCount}</Text>
          <Text style={styles.cta}>Toca para ver más</Text>
        </View>
      </Callout>
    </Marker>
  );
});

const styles = StyleSheet.create({
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  callout: {
    minWidth: 160,
    gap: 2,
    padding: spacing.xs,
  },
  name: { ...typography.bodyStrong, color: colors.textPrimary },
  category: { ...typography.caption, color: colors.primary },
  meta: { ...typography.caption, color: colors.textSecondary },
  votes: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  cta: { ...typography.caption, color: colors.primary, marginTop: 4 },
});
