import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('../../services/reportsService', () => ({
  reportsService: {
    getNearby: jest.fn(),
    createLostReport: jest.fn(),
  },
}));

import { reportsService } from '../../services/reportsService';
import { useCreateLostReportMutation } from '../useLostReports';

function createWrapper(): React.ComponentType<{ children: React.ReactNode }> {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useCreateLostReportMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(reportsService.createLostReport).mockResolvedValue({
      id: 'rep_1',
      notifiedUsersCount: 10,
      searchRadiusKm: 5,
    });
  });

  it('envía el payload correcto al servicio', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateLostReportMutation('pet_1'), { wrapper });

    await result.current.mutateAsync({
      lat: 19.43,
      lng: -99.13,
      lastSeenAt: '2024-03-20T14:33:00.000Z',
      message: 'Collar rojo',
    });

    await waitFor(() => {
      expect(reportsService.createLostReport).toHaveBeenCalledWith('pet_1', {
        lat: 19.43,
        lng: -99.13,
        lastSeenAt: '2024-03-20T14:33:00.000Z',
        message: 'Collar rojo',
      });
    });
  });
});
