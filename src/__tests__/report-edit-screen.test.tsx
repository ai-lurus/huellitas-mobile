import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../stores/authStore';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
  useLocalSearchParams: () => ({ id: 'report-1' }),
}));

jest.mock('../hooks/useReverseGeocodeLabel', () => ({
  useReverseGeocodeLabel: () => ({ data: null, isLoading: false }),
}));

jest.mock('../components/map/LocationPicker', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { LocationPicker: (): React.ReactElement => <View /> };
});

jest.mock('../hooks/useLostReports', () => ({
  useLostReportDetail: jest.fn(),
  useUpdateLostReportMutation: jest.fn(),
}));

import ReportEditScreen from '../../app/(app)/reports/[id]/edit';
import { useLostReportDetail, useUpdateLostReportMutation } from '../hooks/useLostReports';
import type { LostReportDetail } from '../domain/lostReportDetail';

const mockedUseLostReportDetail = jest.mocked(useLostReportDetail);
const mockedUseUpdateLostReportMutation = jest.mocked(useUpdateLostReportMutation);

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

describe('Editar reporte de mascota perdida', () => {
  const mutateAsync = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue(undefined);
    mockedUseUpdateLostReportMutation.mockReturnValue({ mutateAsync } as never);
  });

  afterEach(() => {
    useAuthStore.setState({ isGuest: false });
  });

  it('prellena la descripción actual y guarda los cambios', async () => {
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail(),
      isPending: false,
    } as never);

    const { getByTestId, getByDisplayValue } = render(<ReportEditScreen />);
    await waitFor(() => expect(getByDisplayValue('Llevaba collar rojo')).toBeTruthy());

    fireEvent.changeText(getByTestId('radar.wizard.lost.description'), 'Actualizado: collar azul');
    fireEvent.press(getByTestId('radar.wizard.lost.continue'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const call = mutateAsync.mock.calls[0][0] as { message: string };
    expect(call.message).toBe('Actualizado: collar azul');
    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });

  it('bloquea la edición de un reporte ya resuelto', async () => {
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail({ resolvedAt: new Date().toISOString() }),
      isPending: false,
    } as never);

    const { getByTestId, queryByTestId } = render(<ReportEditScreen />);
    await waitFor(() => expect(getByTestId('report.edit.blocked')).toBeTruthy());
    expect(queryByTestId('radar.wizard.lost.continue')).toBeNull();
  });

  it('bloquea la edición de un reporte inactivo (más de 60 días sin resolver)', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 61);
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail({ createdAt: oldDate.toISOString(), resolvedAt: null }),
      isPending: false,
    } as never);

    const { getByTestId, queryByTestId } = render(<ReportEditScreen />);
    await waitFor(() => expect(getByTestId('report.edit.blocked')).toBeTruthy());
    expect(queryByTestId('radar.wizard.lost.continue')).toBeNull();
  });

  it('modo invitado: redirige hacia atrás al entrar (defensivo)', async () => {
    useAuthStore.setState({ isGuest: true });
    mockedUseLostReportDetail.mockReturnValue({
      data: makeDetail(),
      isPending: false,
      isError: false,
    } as never);
    mockedUseUpdateLostReportMutation.mockReturnValue({ mutateAsync: jest.fn() } as never);

    render(<ReportEditScreen />);

    await waitFor(() => expect(mockBack).toHaveBeenCalled());
  });
});
