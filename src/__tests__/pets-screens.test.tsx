import React from 'react';
import { Alert } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

let mockLocalParams: { id: string } = { id: 'pet_1' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => mockLocalParams,
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
  petsService: {
    listPets: jest.Mock;
    getPet: jest.Mock;
    deletePet: jest.Mock;
  };
};

import PetsScreen from '../../app/(app)/pets/index';
import PetDetailScreen from '../../app/(app)/pets/[id]';

let client: QueryClient | null = null;

function renderWithQuery(ui: React.ReactElement) {
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('Pets screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalParams = { id: 'pet_1' };
    petsService.listPets.mockResolvedValue([]);
    petsService.getPet.mockResolvedValue({
      id: 'pet_1',
      name: 'Max',
      species: 'dog',
      sex: 'male',
      photos: [],
      isLost: false,
    });
  });

  afterEach(async () => {
    if (client) {
      await client.cancelQueries();
      client.clear();
      client = null;
    }
  });

  it('renderiza lista con un PetCard por mascota', async () => {
    petsService.listPets.mockResolvedValueOnce([
      { id: 'pet_1', name: 'Max', species: 'dog', isLost: false, photoUrl: null },
      { id: 'pet_2', name: 'Luna', species: 'cat', isLost: true, photoUrl: null },
    ]);

    const { findByTestId } = renderWithQuery(<PetsScreen />);

    expect(await findByTestId('petCard.pet_1')).toBeTruthy();
    expect(await findByTestId('petCard.pet_2')).toBeTruthy();
  });

  it('muestra empty state cuando no hay mascotas', async () => {
    petsService.listPets.mockResolvedValueOnce([]);
    const { findByText } = renderWithQuery(<PetsScreen />);
    expect(await findByText('Add your first pet')).toBeTruthy();
  });

  it('tap en PetCard navega a detalle', async () => {
    petsService.listPets.mockResolvedValueOnce([
      { id: 'pet_1', name: 'Max', species: 'dog', isLost: false, photoUrl: null },
    ]);

    const { findByTestId } = renderWithQuery(<PetsScreen />);
    fireEvent.press(await findByTestId('petCard.pet_1'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/pets/pet_1');
  });

  it('delete muestra confirmación y al confirmar borra y vuelve a la lista', async () => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    petsService.getPet.mockResolvedValueOnce({
      id: 'pet_1',
      name: 'Max',
      species: 'dog',
      sex: 'male',
      breed: 'Golden Retriever',
      color: 'Dorado',
      age: 3,
      notes: 'ok',
      photos: [],
      isLost: false,
    });
    petsService.deletePet.mockResolvedValueOnce(undefined);

    const { findByTestId } = renderWithQuery(<PetDetailScreen />);

    fireEvent.press(await findByTestId('petDetail.delete'));

    expect(Alert.alert).toHaveBeenCalled();

    const alertArgs = (Alert.alert as jest.Mock).mock.calls[0] ?? [];
    const buttons = alertArgs[2] as Array<{ text: string; onPress?: () => void }> | undefined;
    const confirm = buttons?.find((b) => b.text === 'Sí, eliminar tarjeta');
    expect(confirm).toBeTruthy();

    confirm?.onPress?.();

    await waitFor(() => {
      expect(petsService.deletePet).toHaveBeenCalledWith('pet_1');
      expect(mockReplace).toHaveBeenCalledWith('/(app)/pets');
    });
  });
});
