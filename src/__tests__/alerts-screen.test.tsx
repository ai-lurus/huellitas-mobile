import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import AlertsScreen from '../../app/(app)/alerts';
import type { LostReport } from '../domain/lostReports';
import { useLostReports } from '../hooks/useLostReports';
import { useLocationStore } from '../stores/locationStore';
import { useSettingsStore } from '../stores/settingsStore';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
  MaterialCommunityIcons: (): null => null,
}));

jest.mock('../hooks/useLostReports', () => ({
  useLostReports: jest.fn(),
}));

const reportsUnsorted: LostReport[] = [
  {
    id: 'r-far',
    lat: 19.44,
    lng: -99.14,
    petName: 'Bruno',
    petBreed: 'Mestizo',
    petSpecies: 'dog',
    petPhotoUrl: null,
    distanceMeters: 2300,
    createdAt: '2026-04-29T01:00:00.000Z',
    reportKind: 'lost',
  },
  {
    id: 'r-near',
    lat: 19.433,
    lng: -99.133,
    petName: 'Mishi',
    petBreed: 'Criollo',
    petSpecies: 'cat',
    petPhotoUrl: null,
    distanceMeters: 220,
    createdAt: '2026-04-29T01:10:00.000Z',
    reportKind: 'sighted',
  },
];

describe('Alerts screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocationStore.getState().reset();
    useLocationStore.getState().setLocation({ lat: 19.4326, lng: -99.1332 });
    useSettingsStore.getState().reset();
    jest.mocked(useLostReports).mockReturnValue({
      data: reportsUnsorted,
      isPending: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    } as never);
  });

  it('renderiza los reportes ordenados por distancia ascendente', () => {
    const { getAllByText } = render(<AlertsScreen />);
    const names = getAllByText(/Mishi|Bruno/).map((n) => n.props.children);
    expect(names).toEqual(['Mishi', 'Bruno']);
  });

  it('muestra empty state cuando no hay reportes', () => {
    jest.mocked(useLostReports).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    } as never);

    const { getByTestId } = render(<AlertsScreen />);
    expect(getByTestId('alerts.empty')).toBeTruthy();
  });

  it('muestra skeleton mientras carga', () => {
    jest.mocked(useLostReports).mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      isRefetching: false,
      refetch: mockRefetch,
    } as never);

    const { getByTestId } = render(<AlertsScreen />);
    expect(getByTestId('alerts.skeleton')).toBeTruthy();
  });

  it('tap en card navega a detalle de reporte', () => {
    const { getByTestId } = render(<AlertsScreen />);
    fireEvent.press(getByTestId('report-card.r-near'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/reports/r-near');
  });
});
