import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
}));

jest.mock('../hooks/useLostReports', () => ({
  useMyReports: jest.fn(),
}));

jest.mock('../services/pendingRadarReportStore', () => ({
  loadPendingRadarReport: jest.fn(),
}));

import MyReportsScreen from '../../app/(app)/profile/reports';
import { useMyReports } from '../hooks/useLostReports';
import { loadPendingRadarReport } from '../services/pendingRadarReportStore';

const mockedUseMyReports = jest.mocked(useMyReports);
const mockedLoadPendingRadarReport = jest.mocked(loadPendingRadarReport);

describe('Mis reportes (§7.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadPendingRadarReport.mockResolvedValue(null);
  });

  it('agrupa reportes en Activos y Resueltos', async () => {
    mockedUseMyReports.mockReturnValue({
      data: [
        {
          id: 'r1',
          petName: 'Max',
          petSpecies: 'dog',
          reportKind: 'lost',
          createdAt: '2026-06-01',
        },
        {
          id: 'r2',
          petName: 'Luna',
          petSpecies: 'cat',
          reportKind: 'resolved',
          createdAt: '2026-05-01',
          resolvedAt: '2026-05-10',
        },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId, getByText } = render(<MyReportsScreen />);
    await waitFor(() => expect(getByTestId('profile.reports.item.r1')).toBeTruthy());
    expect(getByText('Max')).toBeTruthy();
    expect(getByText('Luna')).toBeTruthy();
  });

  it('muestra el borrador pendiente de enviar cuando existe', async () => {
    mockedUseMyReports.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);
    mockedLoadPendingRadarReport.mockResolvedValue({
      kind: 'lost',
      petId: 'pet_1',
      createdAt: '2026-07-01T00:00:00.000Z',
      payload: { lat: 0, lng: 0, lastSeenAt: '2026-07-01T00:00:00.000Z', message: 'x' },
    });

    const { getByTestId } = render(<MyReportsScreen />);
    await waitFor(() => expect(getByTestId('profile.reports.pending')).toBeTruthy());
  });

  it('muestra estado vacío cuando no hay reportes ni pendientes', async () => {
    mockedUseMyReports.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<MyReportsScreen />);
    await waitFor(() => expect(getByTestId('profile.reports.empty')).toBeTruthy());
  });
});
