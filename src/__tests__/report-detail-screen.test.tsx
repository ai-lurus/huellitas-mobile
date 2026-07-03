import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'report-1' }),
}));

jest.mock('../components/map/LostReportMap', () => ({
  LostReportMap: (): null => null,
}));

jest.mock('../hooks/useUserProfile', () => ({
  useUserProfile: () => ({ data: undefined }),
}));

jest.mock('../hooks/useReverseGeocodeLabel', () => ({
  useReverseGeocodeLabel: () => ({ data: null }),
}));

jest.mock('../hooks/useLostReports', () => ({
  useLostReportDetail: jest.fn(),
}));

import ReportDetailScreen from '../../app/(app)/reports/[id]';
import { useLostReportDetail } from '../hooks/useLostReports';
import { useAuthStore } from '../stores/authStore';
import type { LostReportDetail } from '../domain/lostReportDetail';

const mockedUseLostReportDetail = jest.mocked(useLostReportDetail);

function makeDetail(overrides: Partial<LostReportDetail> = {}): LostReportDetail {
  return {
    id: 'report-1',
    ownerId: 'owner-1',
    petName: 'Max',
    petSpecies: 'dog',
    petPhotoUrl: 'https://example.com/max.jpg',
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    message: 'Llevaba collar rojo',
    lossLocation: { lat: 19.4326, lng: -99.1332 },
    resolvedAt: null,
    sightings: [],
    ...overrides,
  };
}

describe('Detalle de reporte (Radar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setUser({ id: 'owner-1', name: 'Camila', email: 'c@test.com' });
  });

  it('el dueño ve "Editar reporte" y navega a la pantalla de edición', async () => {
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail(),
      isPending: false,
      isError: false,
    } as never);

    const { getByTestId } = render(<ReportDetailScreen />);
    await waitFor(() => expect(getByTestId('report.detail.edit')).toBeTruthy());

    fireEvent.press(getByTestId('report.detail.edit'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/reports/report-1/edit');
  });

  it('un reporte sin resolver con más de 60 días muestra "INACTIVO" y deshabilita las acciones', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 61);
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail({ createdAt: oldDate.toISOString(), resolvedAt: null }),
      isPending: false,
      isError: false,
    } as never);

    const { getByText, getByTestId } = render(<ReportDetailScreen />);
    await waitFor(() => expect(getByText('INACTIVO')).toBeTruthy());
    expect(getByTestId('report.detail.markFound').props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('report.detail.edit').props.accessibilityState?.disabled).toBe(true);
  });

  it('si la foto principal falla al cargar, muestra el placeholder "Imagen no disponible"', async () => {
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail(),
      isPending: false,
      isError: false,
    } as never);

    const { getByTestId, getByText } = render(<ReportDetailScreen />);
    await waitFor(() => expect(getByTestId('report.detail.hero.photo')).toBeTruthy());

    fireEvent(getByTestId('report.detail.hero.photo'), 'onError');

    await waitFor(() => expect(getByTestId('report.detail.hero.broken')).toBeTruthy());
    expect(getByText('Imagen no disponible')).toBeTruthy();
  });
});
