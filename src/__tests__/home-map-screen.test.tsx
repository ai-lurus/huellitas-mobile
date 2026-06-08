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
  useFocusEffect: (cb: () => void) => cb(),
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
    opacity,
  }: {
    children?: React.ReactNode;
    testID?: string;
    opacity?: number;
  }): React.JSX.Element => React.createElement(View, { testID, opacity }, children);
  const Callout = ({
    children,
    onPress,
    testID,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    testID?: string;
  }): React.JSX.Element => React.createElement(Pressable, { onPress, testID }, children);

  const Circle = ({ testID }: { testID?: string }): React.JSX.Element =>
    React.createElement(View, { testID });
  const Polyline = ({ testID }: { testID?: string }): React.JSX.Element =>
    React.createElement(View, { testID });

  return {
    __esModule: true,
    default: Map,
    Marker,
    Callout,
    Circle,
    Polyline,
    PROVIDER_GOOGLE: 'google',
  };
});

jest.mock('../hooks/useLostReports', () => ({
  useLostReports: jest.fn(),
}));

jest.mock('../hooks/usePlaces', () => ({
  useNearbyPlaces: () => ({ data: [], isPending: false, isError: false }),
  useUpvotePlace: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../hooks/useRoutes', () => ({
  useNearbyRoutes: () => ({ data: [], isPending: false, isError: false }),
  useRateRoute: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('../hooks/useStrayReports', () => ({
  useNearbyStrayReports: () => ({ data: [], isPending: false, isError: false }),
}));

jest.mock('../stores/settingsStore', () => ({
  useSettingsStore: (
    selector: (s: { alertRadiusKm: number; setAlertRadius: () => void }) => unknown,
  ) => selector({ alertRadiusKm: 5, setAlertRadius: jest.fn() }),
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
      fetchStatus: 'idle',
    } as never);
  });

  it('renderiza markers para cada reporte', () => {
    const { getByTestId } = render(<MapScreen />);
    expect(getByTestId('marker.r1')).toBeTruthy();
    expect(getByTestId('marker.r2')).toBeTruthy();
  });

  it('filtra markers por especie via opacity sin desmontar', () => {
    const { getByTestId } = render(<MapScreen />);
    fireEvent.press(getByTestId('map.filter.dog'));
    expect(getByTestId('marker.r1').props.opacity).toBe(1);
    expect(getByTestId('marker.r2').props.opacity).toBe(0);
  });

  it('al cambiar de perros a gatos muestra solo gatos', () => {
    const { getByTestId } = render(<MapScreen />);
    fireEvent.press(getByTestId('map.filter.dog'));
    fireEvent.press(getByTestId('map.filter.cat'));
    expect(getByTestId('marker.r1').props.opacity).toBe(0);
    expect(getByTestId('marker.r2').props.opacity).toBe(1);
  });

  it('tap en callout navega al detalle del reporte', () => {
    const { getByTestId } = render(<MapScreen />);
    fireEvent.press(getByTestId('marker.callout.r1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/reports/r1');
  });
});
