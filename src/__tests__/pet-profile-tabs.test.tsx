import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'pet_1' }),
}));

jest.mock('../services/petsService', () => ({
  MAX_PETS_PER_USER: 3,
  petsService: {
    createPet: jest.fn(),
    uploadPetPhoto: jest.fn(),
    listPets: jest.fn(),
    getPet: jest.fn(),
    updatePet: jest.fn(),
    deletePet: jest.fn(),
  },
}));

const { petsService } = jest.requireMock('../services/petsService') as {
  petsService: { getPet: jest.Mock; listPets: jest.Mock };
};

import PetDetailScreen from '../../app/(app)/pets/[id]';

function renderScreen(): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PetDetailScreen />
    </QueryClientProvider>,
  );
}

describe('Perfil de mascota (tabs Datos/Carnet/Rutina)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    petsService.listPets.mockResolvedValue([]);
    petsService.getPet.mockResolvedValue({
      id: 'pet_1',
      name: 'Max',
      species: 'dog',
      sex: 'male',
      hasMicrochip: true,
      photos: [],
      isLost: false,
    });
  });

  it('muestra el tab Datos por defecto con acceso a eliminar', async () => {
    const { findByTestId } = renderScreen();
    expect(await findByTestId('petProfile.tab.datos.content')).toBeTruthy();
    expect(await findByTestId('petDetail.delete')).toBeTruthy();
  });

  it('cambia a Carnet y muestra las vacunas mock con estado', async () => {
    const { findByTestId } = renderScreen();
    fireEvent.press(await findByTestId('petProfile.tab.carnet'));
    expect(await findByTestId('petProfile.tab.carnet.content')).toBeTruthy();
    expect(await findByTestId('petCarnet.vaccine.mock-vaccine-pet_1-0')).toBeTruthy();
  });

  it('agrega una vacuna nueva desde el modal de Carnet', async () => {
    const { findByTestId, findByText } = renderScreen();
    fireEvent.press(await findByTestId('petProfile.tab.carnet'));
    fireEvent.press(await findByTestId('petCarnet.addVaccine'));
    fireEvent.changeText(await findByTestId('petCarnet.vaccineForm.name'), 'Parvovirus');
    fireEvent.press(await findByTestId('petCarnet.vaccineForm.save'));

    expect(await findByText('Parvovirus')).toBeTruthy();
  });

  it('cambia a Rutina y completar una tarea la saca de "Próximas tareas"', async () => {
    const { findByTestId, queryByTestId, getByText } = renderScreen();
    fireEvent.press(await findByTestId('petProfile.tab.rutina'));
    expect(await findByTestId('petProfile.tab.rutina.content')).toBeTruthy();

    const taskId = 'mock-routine-pet_1-0';
    expect(await findByTestId(`petRutina.task.${taskId}`)).toBeTruthy();
    expect(getByText('Próximas tareas (3)')).toBeTruthy();

    fireEvent.press(await findByTestId(`petRutina.task.${taskId}.checkbox`));

    await waitFor(() => {
      expect(queryByTestId(`petRutina.task.${taskId}`)).toBeNull();
      expect(getByText('Próximas tareas (2)')).toBeTruthy();
    });
  });
});
