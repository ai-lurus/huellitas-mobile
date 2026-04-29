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
