import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import HomeScreen from '../../app/(app)/index';
import { usePets } from '../hooks/usePets';
import { useLostReports } from '../hooks/useLostReports';
import { useAuthStore } from '../stores/authStore';
import { useLocationStore } from '../stores/locationStore';
import type { Pet } from '../domain/pets';
import type { LostReport } from '../domain/lostReports';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('../hooks/usePets', () => ({
  usePets: jest.fn(),
}));

jest.mock('../hooks/useLostReports', () => ({
  useLostReports: jest.fn(),
}));

jest.mock('../stores/settingsStore', () => ({
  useSettingsStore: (
    selector: (s: { alertRadiusKm: number; setAlertRadius: () => void }) => unknown,
  ) => selector({ alertRadiusKm: 5, setAlertRadius: jest.fn() }),
}));

function makePet(overrides: Partial<Pet> = {}): Pet {
  return { id: 'pet-1', name: 'Kenia', species: 'dog', ...overrides };
}

function makeReport(overrides: Partial<LostReport> = {}): LostReport {
  return {
    id: 'report-1',
    lat: 19.4326,
    lng: -99.1332,
    petName: 'Lalo',
    petSpecies: 'dog',
    distanceMeters: 600,
    createdAt: new Date().toISOString(),
    reportKind: 'lost',
    ...overrides,
  };
}

function mockPets(pets: Pet[]): void {
  jest.mocked(usePets).mockReturnValue({
    pets,
    isLoading: false,
    petsQuery: { isError: false, refetch: jest.fn() },
  } as never);
}

function mockReports(data: LostReport[]): void {
  jest.mocked(useLostReports).mockReturnValue({
    data,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    fetchStatus: 'idle',
  } as never);
}

describe('Dashboard (Home) screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useLocationStore.getState().reset();
    useLocationStore.getState().setLocation({ lat: 19.4326, lng: -99.1332 });
    useAuthStore.getState().setUser({ id: 'u1', name: 'Camila', email: 'camila@test.com' });
    mockReports([]);
  });

  it('saluda al usuario y muestra la racha y las tareas de hoy', () => {
    mockPets([makePet()]);
    const { getByText, getByTestId } = render(<HomeScreen />);
    expect(getByText('¡Hola, Camila!')).toBeTruthy();
    expect(getByText('Tareas de hoy')).toBeTruthy();
    expect(getByTestId('home.streak')).toBeTruthy();
  });

  it('sin mascotas, no muestra racha y muestra el estado vacío con CTA para agregar la primera', () => {
    mockPets([]);
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    expect(getByTestId('home.tasks.empty.no-pets')).toBeTruthy();
    expect(queryByTestId('home.streak')).toBeNull();
  });

  it('muestra recordatorios cuando hay mascotas y los oculta cuando no', () => {
    mockPets([makePet()]);
    const withPets = render(<HomeScreen />);
    expect(withPets.getByTestId('home.reminders')).toBeTruthy();
    withPets.unmount();

    mockPets([]);
    const withoutPets = render(<HomeScreen />);
    expect(withoutPets.queryByTestId('home.reminders')).toBeNull();
  });

  it('permite marcar una tarea como completada localmente', () => {
    mockPets([makePet()]);
    const { getByTestId, getByText } = render(<HomeScreen />);
    const checkbox = getByTestId('home.tasks.checkbox.mock-task-pet-1-0');
    fireEvent.press(checkbox);
    expect(getByText('1/2')).toBeTruthy();
  });

  it('muestra la lista de alertas cercanas en vez de un mapa', () => {
    mockPets([makePet()]);
    mockReports([makeReport()]);
    const { getByTestId, queryByTestId } = render(<HomeScreen />);
    expect(getByTestId('home.nearbyAlerts')).toBeTruthy();
    expect(queryByTestId('home.quickmap')).toBeNull();
  });

  it('Levantar reporte navega al wizard unificado de Radar', () => {
    mockPets([makePet({ id: 'pet-9' })]);
    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('home.report-button'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/radar/report/new');
  });
});
