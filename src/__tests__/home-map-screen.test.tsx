import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import MapScreen from '../../app/(app)/map';
import type { LostReport } from '../domain/lostReports';
import { useLostReports } from '../hooks/useLostReports';
import { useLocationStore } from '../stores/locationStore';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('react-native-maps', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View, Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  const Map = React.forwardRef(
    (
      props: React.ComponentProps<typeof View> & {
        children?: React.ReactNode;
        onMapReady?: () => void;
      },
      _ref: React.Ref<unknown>,
    ) => {
      React.useEffect(() => {
        props.onMapReady?.();
      }, [props]);
      return React.createElement(View, props, props.children);
    },
  );
  Map.displayName = 'MockMapView';
  const Marker = ({
    children,
    testID,
  }: {
    children?: React.ReactNode;
    testID?: string;
  }): React.JSX.Element => React.createElement(View, { testID }, children);
  const Callout = ({
    children,
    onPress,
    testID,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    testID?: string;
  }): React.JSX.Element => React.createElement(Pressable, { onPress, testID }, children);

  return {
    __esModule: true,
    default: Map,
    Marker,
    Callout,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('../hooks/useLostReports', () => ({
  useLostReports: jest.fn(),
}));

const baseReports: LostReport[] = [
  {
    id: 'r1',
    lat: 19.4326,
    lng: -99.1332,
    petName: 'Luna',
    petBreed: 'Mestiza',
    petSpecies: 'dog',
    petPhotoUrl: null,
    distanceMeters: 120,
    createdAt: '2026-04-28T18:00:00.000Z',
    reportKind: 'lost',
  },
  {
    id: 'r2',
    lat: 19.4329,
    lng: -99.1336,
    petName: 'Milo',
    petBreed: 'Siamés',
    petSpecies: 'cat',
    petPhotoUrl: null,
    distanceMeters: 240,
    createdAt: '2026-04-28T18:30:00.000Z',
    reportKind: 'lost',
  },
];

describe('Map tab screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocationStore.getState().reset();
    useLocationStore.getState().setLocation({ lat: 19.4326, lng: -99.1332 });
    jest.mocked(useLostReports).mockReturnValue({
      data: baseReports,
      isPending: false,
      isError: false,
    } as never);
  });

  it('renderiza markers para cada reporte', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('marker.r1')).toBeTruthy();
    expect(getByTestId('marker.r2')).toBeTruthy();
  });

  it('filtra markers por especie sin refetch', () => {
    const { getByTestId, queryByTestId } = render(<MapScreen />);
    fireEvent.press(getByTestId('map.filter.dog'));
    expect(getByTestId('marker.r1')).toBeTruthy();
    expect(queryByTestId('marker.r2')).toBeNull();
  });

  it('tap en callout navega al detalle del reporte', () => {
    const { getByTestId } = render(<MapScreen />);
    fireEvent.press(getByTestId('marker.callout.r1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/reports/r1');
  });
});
