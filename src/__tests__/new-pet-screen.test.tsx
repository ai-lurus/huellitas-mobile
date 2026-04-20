import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'pet_1' }),
}));

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const ImagePicker = jest.requireMock('expo-image-picker') as {
  requestMediaLibraryPermissionsAsync: jest.Mock;
  launchImageLibraryAsync: jest.Mock;
};

jest.mock('../services/petsService', () => ({
  MAX_PETS_PER_USER: 3,
  petsService: {
    createPet: jest.fn(),
    uploadPetPhoto: jest.fn(),
    listPets: jest.fn().mockResolvedValue([]),
    deletePet: jest.fn(),
  },
}));

const { petsService } = jest.requireMock('../services/petsService') as {
  petsService: {
    createPet: jest.Mock;
    uploadPetPhoto: jest.Mock;
    listPets: jest.Mock;
    deletePet: jest.Mock;
  };
};

import NewPetScreen from '../../app/(app)/pets/new';

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

describe('NewPetScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });
  });

  afterEach(async () => {
    if (client) {
      await client.cancelQueries();
      client.clear();
      client = null;
    }
  });

  it('sube fotos y navega al detalle en éxito', async () => {
    petsService.createPet.mockResolvedValueOnce({ id: 'pet_1', name: 'Max' });
    petsService.uploadPetPhoto.mockResolvedValueOnce('ok');
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.jpg' }],
    });

    const { getByTestId } = renderWithQuery(<NewPetScreen />);

    fireEvent.changeText(getByTestId('petForm.name'), 'Max');
    fireEvent.press(getByTestId('petForm.photo.add'));
    await waitFor(() => expect(getByTestId('petForm.photo.remove.0')).toBeTruthy());

    fireEvent.press(getByTestId('petForm.submit'));

    await waitFor(() => {
      expect(petsService.createPet).toHaveBeenCalled();
      expect(petsService.uploadPetPhoto).toHaveBeenCalledWith('pet_1', 'file:///tmp/a.jpg');
      expect(mockReplace).toHaveBeenCalledWith('/(app)/pets');
    });
  });

  it('muestra error de límite 3 mascotas cuando backend responde 422', async () => {
    petsService.createPet.mockRejectedValueOnce({ response: { status: 422 } });

    const { getByTestId, findByText } = renderWithQuery(<NewPetScreen />);

    fireEvent.changeText(getByTestId('petForm.name'), 'Max');
    fireEvent.press(getByTestId('petForm.submit'));

    expect(await findByText('Solo puedes tener un máximo de 3 mascotas')).toBeTruthy();
  });

  it('cancel navega atrás', () => {
    const { getByTestId } = renderWithQuery(<NewPetScreen />);
    fireEvent.press(getByTestId('petForm.cancel'));
    expect(mockBack).toHaveBeenCalled();
  });
});
