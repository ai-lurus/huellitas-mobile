import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: { type?: string; petId?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

let mockIsConnected = true;

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: mockIsConnected, isInternetReachable: true }),
}));

jest.mock('../hooks/usePets', () => ({
  usePets: jest.fn(),
}));

jest.mock('../hooks/useLostReports', () => ({
  useCreateLostReportMutation: jest.fn(),
}));

jest.mock('../hooks/useStrayReports', () => ({
  useCreateStrayReport: jest.fn(),
}));

jest.mock('../hooks/useReverseGeocodeLabel', () => ({
  useReverseGeocodeLabel: () => ({ data: null, isLoading: false }),
}));

jest.mock('../services/pendingRadarReportStore', () => ({
  savePendingRadarReport: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../stores/settingsStore', () => ({
  useSettingsStore: (sel: (s: { alertRadiusKm: number }) => number): number =>
    sel({ alertRadiusKm: 5 }),
}));

jest.mock('../stores/locationStore', () => ({
  useLocationStore: (sel: (s: { currentLocation: { lat: number; lng: number } }) => unknown) =>
    sel({ currentLocation: { lat: 19.4326, lng: -99.1332 } }),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
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
        <Pressable onPress={(): void => onSelect(19.4, -99.1)} testID="mock.locationPin" />
      </View>
    ),
  };
});

import RadarCreateReportScreen from '../../app/(app)/radar/report/new';
import { usePets } from '../hooks/usePets';
import { useCreateLostReportMutation } from '../hooks/useLostReports';
import { useCreateStrayReport } from '../hooks/useStrayReports';
import { savePendingRadarReport } from '../services/pendingRadarReportStore';
import * as ImagePicker from 'expo-image-picker';

const mockedUsePets = jest.mocked(usePets);
const mockedUseCreateLostReportMutation = jest.mocked(useCreateLostReportMutation);
const mockedUseCreateStrayReport = jest.mocked(useCreateStrayReport);
const mockedLaunchImageLibraryAsync = jest.mocked(ImagePicker.launchImageLibraryAsync);

function mockPets(
  pets: Array<{ id: string; name?: string; species?: string; photos?: string[] }>,
): void {
  mockedUsePets.mockReturnValue({ pets, isLoading: false } as never);
}

describe('Radar unified create-report wizard', () => {
  const lostMutateAsync = jest.fn().mockResolvedValue({ id: 'report_1', searchRadiusKm: 5 });
  const strayMutateAsync = jest.fn().mockResolvedValue({ id: 'stray_1' });

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockIsConnected = true;
    mockPets([
      { id: 'pet-1', name: 'Max', species: 'dog', photos: ['https://example.com/max.jpg'] },
    ]);
    mockedUseCreateLostReportMutation.mockReturnValue({
      mutateAsync: lostMutateAsync,
      isPending: false,
    } as never);
    mockedUseCreateStrayReport.mockReturnValue({
      mutateAsync: strayMutateAsync,
      isPending: false,
    } as never);
  });

  it('con type=lost y petId, va directo a los datos de la mascota y envía el reporte', async () => {
    mockParams = { type: 'lost', petId: 'pet-1' };
    const { getByTestId, getByText } = render(<RadarCreateReportScreen />);

    await waitFor(() => expect(getByTestId('radar.wizard.lost.description')).toBeTruthy());

    fireEvent.changeText(getByTestId('radar.wizard.lost.description'), 'Llevaba collar rojo');
    fireEvent.press(getByTestId('radar.wizard.lost.continue'));

    await waitFor(() => expect(getByTestId('radar.wizard.review.submit')).toBeTruthy());
    expect(getByText(/Max perdida/)).toBeTruthy();

    fireEvent.press(getByTestId('radar.wizard.review.submit'));

    await waitFor(() => expect(lostMutateAsync).toHaveBeenCalled());
    const call = lostMutateAsync.mock.calls[0][0] as { message: string };
    expect(call.message).toBe('Llevaba collar rojo');

    await waitFor(() => expect(getByTestId('radar.wizard.review.success.ok')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.review.success.ok'));
    expect(mockReplace).toHaveBeenCalledWith('/(app)/map');
  });

  it('bloquea el envío del reporte de mascota perdida si la descripción está vacía', async () => {
    mockParams = { type: 'lost', petId: 'pet-1' };
    const { getByTestId, queryByTestId } = render(<RadarCreateReportScreen />);

    await waitFor(() => expect(getByTestId('radar.wizard.lost.continue')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.lost.continue'));

    expect(queryByTestId('radar.wizard.review.submit')).toBeNull();
  });

  it('con type=stray, exige al menos una foto antes de continuar y luego envía el reporte', async () => {
    mockParams = { type: 'stray' };
    mockedLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file://photo1.jpg' } as never],
    } as never);

    const { getByTestId, queryByTestId } = render(<RadarCreateReportScreen />);

    await waitFor(() => expect(getByTestId('radar.wizard.stray.description')).toBeTruthy());
    fireEvent.changeText(getByTestId('radar.wizard.stray.description'), 'Collar azul, muy dócil');
    fireEvent.press(getByTestId('radar.wizard.stray.continue'));

    expect(queryByTestId('radar.wizard.review.submit')).toBeNull();

    await act(async () => {
      fireEvent.press(getByTestId('radar.wizard.stray.photos.add'));
    });

    fireEvent.press(getByTestId('radar.wizard.stray.continue'));

    await waitFor(() => expect(getByTestId('radar.wizard.review.submit')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.review.submit'));

    await waitFor(() => expect(strayMutateAsync).toHaveBeenCalled());
    const call = strayMutateAsync.mock.calls[0][0] as { photoUris: string[]; description: string };
    expect(call.photoUris).toEqual(['file://photo1.jpg']);
    expect(call.description).toBe('Collar azul, muy dócil');
  });

  it('sin conexión, guarda el reporte como pendiente en vez de enviarlo', async () => {
    mockIsConnected = false;
    mockParams = { type: 'lost', petId: 'pet-1' };
    const { getByTestId } = render(<RadarCreateReportScreen />);

    await waitFor(() => expect(getByTestId('radar.wizard.lost.description')).toBeTruthy());
    fireEvent.changeText(
      getByTestId('radar.wizard.lost.description'),
      'Se perdió cerca del parque',
    );
    fireEvent.press(getByTestId('radar.wizard.lost.continue'));

    await waitFor(() => expect(getByTestId('radar.wizard.review.submit')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.review.submit'));

    await waitFor(() => expect(savePendingRadarReport).toHaveBeenCalled());
    expect(lostMutateAsync).not.toHaveBeenCalled();
    await waitFor(() => expect(getByTestId('radar.wizard.review.pending.ok')).toBeTruthy());
  });

  it('sin params, con varias mascotas, muestra el selector de tipo y luego el de mascota', async () => {
    mockPets([
      { id: 'pet-1', name: 'Max' },
      { id: 'pet-2', name: 'Luna' },
    ]);
    const { getByTestId } = render(<RadarCreateReportScreen />);

    await waitFor(() => expect(getByTestId('radar.wizard.type.lost')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.type.lost'));

    await waitFor(() => expect(getByTestId('radar.wizard.type.pet.pet-2')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.type.pet.pet-2'));

    await waitFor(() => expect(getByTestId('radar.wizard.lost.description')).toBeTruthy());
  });

  it('sin mascotas, elegir "Perdí a mi mascota" muestra una alerta bloqueante', async () => {
    mockPets([]);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = render(<RadarCreateReportScreen />);

    await waitFor(() => expect(getByTestId('radar.wizard.type.lost')).toBeTruthy());
    fireEvent.press(getByTestId('radar.wizard.type.lost'));

    expect(alertSpy).toHaveBeenCalledWith(
      'Necesitas una mascota registrada',
      expect.any(String),
      expect.any(Array),
    );
  });
});
