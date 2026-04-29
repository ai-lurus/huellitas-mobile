import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

import { useLocationStore } from '../stores/locationStore';
import { HuellitasMap } from '../components/map/HuellitasMap';

const mockAnimateToRegion = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('react-native-maps', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockMap = (props: React.ComponentProps<typeof View> & { children?: React.ReactNode }) =>
    React.createElement(View, props, props.children);

  const moduleShape = MockMap as typeof MockMap & { PROVIDER_GOOGLE: string };
  moduleShape.PROVIDER_GOOGLE = 'google';
  return moduleShape;
});

describe('HuellitasMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocationStore.getState().reset();
    useLocationStore.getState().setLocation({ lat: 40.4168, lng: -3.7038 });
  });

  it('renderiza el mapa base', () => {
    const { getByTestId } = render(<HuellitasMap />);
    expect(getByTestId('huellitas-map')).toBeTruthy();
  });

  it('muestra indicador de ubicación de usuario', () => {
    const { getByTestId } = render(<HuellitasMap />);
    const map = getByTestId('huellitas-map');
    expect(map.props.showsUserLocation).toBe(true);
  });

  it('CenterButton centra el mapa usando animateToRegion', () => {
    const mapRefOverride = {
      current: { animateToRegion: mockAnimateToRegion },
    };
    const { getByTestId } = render(<HuellitasMap mapRefOverride={mapRefOverride} />);

    fireEvent.press(getByTestId('map.center-button'));

    expect(mockAnimateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: 40.4168,
        longitude: -3.7038,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }),
      500,
    );
  });

  it('usa la ubicación actualizada al volver a centrar', () => {
    const mapRefOverride = {
      current: { animateToRegion: mockAnimateToRegion },
    };
    const { getByTestId } = render(<HuellitasMap mapRefOverride={mapRefOverride} />);
    const button = getByTestId('map.center-button');

    fireEvent.press(button);
    act(() => {
      useLocationStore.getState().setLocation({ lat: 19.4326, lng: -99.1332 });
    });
    fireEvent.press(button);

    expect(mockAnimateToRegion).toHaveBeenLastCalledWith(
      expect.objectContaining({
        latitude: 19.4326,
        longitude: -99.1332,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }),
      500,
    );
  });
});
