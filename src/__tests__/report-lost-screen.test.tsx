import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
    push: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'pet_1' }),
}));

jest.mock('../hooks/usePets', () => ({
  usePet: jest.fn(),
}));

jest.mock('../hooks/useLostReports', () => ({
  useCreateLostReportMutation: jest.fn(),
}));

jest.mock('../components/map/LocationPicker', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    LocationPicker: ({
      onSelect,
      testID,
    }: {
      onSelect: (lat: number, lng: number) => void;
      testID?: string;
    }): React.ReactElement => (
      <View testID={testID}>
        <Pressable
          accessibilityLabel="Simular pin"
          onPress={(): void => onSelect(19.432695, -99.134501)}
          testID="mock.locationPin"
        />
      </View>
    ),
  };
});

jest.mock('../stores/settingsStore', () => ({
  useSettingsStore: (sel: (s: { alertRadiusKm: number }) => number): number =>
    sel({ alertRadiusKm: 5 }),
}));

jest.mock('../stores/locationStore', () => ({
  useLocationStore: (sel: (s: { currentLocation: null }) => null): null =>
    sel({ currentLocation: null }),
}));

const { usePet } = jest.requireMock('../hooks/usePets') as {
  usePet: jest.Mock;
};
const { useCreateLostReportMutation } = jest.requireMock('../hooks/useLostReports') as {
  useCreateLostReportMutation: jest.Mock;
};

import ReportLostScreen from '../../app/(app)/pets/[id]/report-lost';

function renderWithClient(ui: React.ReactElement): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('ReportLostScreen', () => {
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({
      id: 'report_xyz',
      notifiedUsersCount: 152,
      searchRadiusKm: 5,
    });
    useCreateLostReportMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
      isError: false,
      error: null,
      reset: jest.fn(),
    });
    usePet.mockReturnValue({
      data: {
        id: 'pet_1',
        name: 'Max',
        species: 'dog',
        photos: ['https://example.com/pet.jpg'],
      },
      isPending: false,
    });
  });

  it('muestra el paso de vista previa y envía el reporte con payload coherente', async () => {
    const { getByTestId } = renderWithClient(<ReportLostScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('reportLost.details.continue'));
    });

    await waitFor(() => {
      expect(getByTestId('reportLost.locationPicker')).toBeTruthy();
    });

    fireEvent.press(getByTestId('mock.locationPin'));

    fireEvent.press(getByTestId('reportLost.location.confirm'));

    expect(getByTestId('reportLost.preview.coords').props.children).toContain('19.432695');

    fireEvent.press(getByTestId('reportLost.submit'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
    });

    const call = mutateAsync.mock.calls[0][0] as {
      lat: number;
      lng: number;
      lastSeenAt: string;
      message?: string;
    };
    expect(call.lat).toBe(19.432695);
    expect(call.lng).toBe(-99.134501);
    expect(typeof call.lastSeenAt).toBe('string');
  });

  it('navega al detalle del reporte al confirmar éxito', async () => {
    const { getByTestId } = renderWithClient(<ReportLostScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('reportLost.details.continue'));
    });
    await waitFor(() => expect(getByTestId('reportLost.locationPicker')).toBeTruthy());
    fireEvent.press(getByTestId('mock.locationPin'));
    fireEvent.press(getByTestId('reportLost.location.confirm'));
    fireEvent.press(getByTestId('reportLost.submit'));

    await waitFor(() => {
      expect(getByTestId('reportLost.success.ok')).toBeTruthy();
    });

    fireEvent.press(getByTestId('reportLost.success.ok'));

    expect(mockReplace).toHaveBeenCalledWith('/(app)/reports/report_xyz');
  });
});
