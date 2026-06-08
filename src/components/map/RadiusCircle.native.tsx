import { Circle } from 'react-native-maps';

interface RadiusCircleProps {
  center: { lat: number; lng: number };
  radiusKm: number;
}

export function RadiusCircle({ center, radiusKm }: RadiusCircleProps): React.JSX.Element {
  return (
    <Circle
      center={{ latitude: center.lat, longitude: center.lng }}
      radius={radiusKm * 1000}
      fillColor="rgba(94, 114, 228, 0.08)"
      strokeColor="rgba(94, 114, 228, 0.4)"
      strokeWidth={1.5}
    />
  );
}
