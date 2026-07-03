import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { reportsService } from '../../services/reportsService';
import { useLostReports } from '../useLostReports';

jest.mock('../../services/reportsService', () => ({
  reportsService: {
    getNearby: jest.fn(),
  },
}));

function createWrapper(): React.ComponentType<{ children: React.ReactNode }> {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

describe('useLostReports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.mocked(reportsService.getNearby).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filtra reportes sin resolver con más de 60 días de antigüedad ("Inactivo")', async () => {
    const now = new Date('2026-07-02T12:00:00.000Z');
    jest.setSystemTime(now);

    const fresh = { id: 'r1', createdAt: '2026-06-01T00:00:00.000Z', reportKind: 'lost' as const };
    const old = { id: 'r2', createdAt: '2026-01-01T00:00:00.000Z', reportKind: 'lost' as const };
    const oldButResolved = {
      id: 'r3',
      createdAt: '2026-01-01T00:00:00.000Z',
      reportKind: 'resolved' as const,
    };
    jest.mocked(reportsService.getNearby).mockResolvedValue([fresh, old, oldButResolved] as never);

    const wrapper = createWrapper();
    const { result } = renderHook(
      () => useLostReports({ lat: 19.4326, lng: -99.1332, radius: 3 }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('hace polling cada 30s', async () => {
    const wrapper = createWrapper();

    renderHook(
      () =>
        useLostReports({
          lat: 19.4326,
          lng: -99.1332,
          radius: 3,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(reportsService.getNearby).toHaveBeenCalledTimes(1);
    });

    jest.advanceTimersByTime(30_000);

    await waitFor(() => {
      expect(reportsService.getNearby).toHaveBeenCalledTimes(2);
    });
  });
});
