import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { LocationPicker } from '../components/map/LocationPicker';
import { useLocationStore } from '../stores/locationStore';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 19.5,
      longitude: -99.2,
      altitude: null,
      accuracy: 5,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  })),
}));

jest.mock('react-native-maps', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockMap = (
    props: React.ComponentProps<typeof View> & {
      onPress?: (e: {
        nativeEvent: { coordinate: { latitude: number; longitude: number } };
      }) => void;
    },
  ) => React.createElement(View, props, props.children);

  const MockMarker = (props: React.ComponentProps<typeof View>): React.ReactElement =>
    React.createElement(View, props);

  const moduleShape = MockMap as typeof MockMap & {
    PROVIDER_GOOGLE: string;
    Marker: typeof MockMarker;
  };
  moduleShape.PROVIDER_GOOGLE = 'google';
  moduleShape.Marker = MockMarker;
  return moduleShape;
});

describe('LocationPicker', () => {
  beforeEach(() => {
    useLocationStore.getState().reset();
    useLocationStore.getState().setLocation({ lat: 19.4, lng: -99.1 });
  });

  it('notifica coordenadas al tocar el mapa', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<LocationPicker onSelect={onSelect} testID="lp" />);

    const map = getByTestId('lp.map');
    fireEvent(map, 'onPress', {
      nativeEvent: { coordinate: { latitude: 19.432695, longitude: -99.134501 } },
    });

    expect(onSelect).toHaveBeenCalledWith(19.432695, -99.134501);
  });

  it('expone el botón Usar mi ubicación', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<LocationPicker onSelect={onSelect} testID="lp" />);
    expect(getByTestId('lp.useMyLocation')).toBeTruthy();
  });
});
