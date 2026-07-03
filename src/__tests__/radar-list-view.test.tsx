import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { RadarListView } from '../components/radar/RadarListView';
import type { LostReport } from '../domain/lostReports';
import type { StrayReport } from '../domain/strayReports';
import { useLostReports } from '../hooks/useLostReports';
import { useNearbyStrayReports } from '../hooks/useStrayReports';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('../hooks/useLostReports', () => ({
  useLostReports: jest.fn(),
}));

jest.mock('../hooks/useStrayReports', () => ({
  useNearbyStrayReports: jest.fn(),
}));

const lostReports: LostReport[] = [
  {
    id: 'lost-far',
    lat: 19.44,
    lng: -99.14,
    petName: 'Bruno',
    petBreed: 'Mestizo',
    petSpecies: 'dog',
    petPhotoUrl: null,
    distanceMeters: 5000,
    createdAt: new Date().toISOString(),
    reportKind: 'lost',
  },
  {
    id: 'lost-resolved',
    lat: 19.433,
    lng: -99.133,
    petName: 'Firu',
    petBreed: 'Mestizo',
    petSpecies: 'dog',
    petPhotoUrl: null,
    distanceMeters: 100,
    createdAt: new Date().toISOString(),
    reportKind: 'resolved',
  },
];

const strayReports: StrayReport[] = [
  {
    id: 'stray-near',
    reporterId: 'u1',
    species: 'cat',
    color: 'Negro',
    description: null,
    photoUrl: null,
    status: 'unmatched',
    matchedReportId: null,
    lat: 19.4326,
    lng: -99.1332,
    seenAt: '2019-01-01T00:00:00.000Z',
    createdAt: '2019-01-01T00:00:00.000Z',
  },
];

function renderList(overrides: Partial<React.ComponentProps<typeof RadarListView>> = {}) {
  return render(
    <RadarListView
      searchCenter={{ lat: 19.4326, lng: -99.1332 }}
      radiusKm={10}
      speciesFilter="all"
      typeFilter="all"
      dateRangeFilter="all"
      onOpenItem={jest.fn()}
      {...overrides}
    />,
  );
}

describe('RadarListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useLostReports).mockReturnValue({
      data: lostReports,
      isPending: false,
      isError: false,
      isRefetching: false,
      fetchStatus: 'idle',
      refetch: jest.fn(),
    } as never);
    jest.mocked(useNearbyStrayReports).mockReturnValue({
      data: strayReports,
      isPending: false,
      isError: false,
      isRefetching: false,
      fetchStatus: 'idle',
      refetch: jest.fn(),
    } as never);
  });

  it('mezcla reportes perdidos y encontrados, ordenados por cercanía, excluyendo resueltos', () => {
    const { getAllByText, queryByTestId } = renderList();
    const names = getAllByText(/Bruno|Mascota sin identificar/).map((n) => n.props.children);
    expect(names).toEqual(['Mascota sin identificar', 'Bruno']);
    expect(queryByTestId('radar.listItem.lost-resolved')).toBeNull();
  });

  it('ordena por más reciente al cambiar el sort', () => {
    const { getByTestId, getAllByText } = renderList();
    fireEvent.press(getByTestId('radar.list.sort.recent'));
    const names = getAllByText(/Bruno|Mascota sin identificar/).map((n) => n.props.children);
    expect(names).toEqual(['Bruno', 'Mascota sin identificar']);
  });

  it('filtra por tipo "stray" mostrando solo mascotas encontradas', () => {
    const { getByTestId, queryByTestId } = renderList({ typeFilter: 'stray' });
    expect(getByTestId('radar.listItem.stray-near')).toBeTruthy();
    expect(queryByTestId('radar.listItem.lost-far')).toBeNull();
  });

  it('tap en un item invoca onOpenItem con el href correspondiente', () => {
    const onOpenItem = jest.fn();
    const { getByTestId } = renderList({ onOpenItem });
    fireEvent.press(getByTestId('radar.listItem.stray-near'));
    expect(onOpenItem).toHaveBeenCalledWith('/(app)/stray/stray-near');
  });

  it('muestra empty state cuando no hay reportes activos', () => {
    jest.mocked(useLostReports).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isRefetching: false,
      fetchStatus: 'idle',
      refetch: jest.fn(),
    } as never);
    jest.mocked(useNearbyStrayReports).mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      isRefetching: false,
      fetchStatus: 'idle',
      refetch: jest.fn(),
    } as never);
    const { getByTestId } = renderList();
    expect(getByTestId('radar.list.empty')).toBeTruthy();
  });
});
