import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('../hooks/useServices', () => ({
  useServiceCatalog: jest.fn(),
}));

import ServicesScreen from '../../app/(app)/services';
import { useServiceCatalog } from '../hooks/useServices';
import { useAuthStore } from '../stores/authStore';

const mockedUseServiceCatalog = jest.mocked(useServiceCatalog);

describe('Catálogo de servicios (Radar §6.1)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    useAuthStore.setState({ isGuest: false });
  });

  it('lista las categorías y navega al detalle al tocar una', async () => {
    mockedUseServiceCatalog.mockReturnValue({
      data: [
        { id: 'cat_grooming', key: 'grooming', name: 'Grooming', description: 'Baño y corte' },
        { id: 'cat_vet', key: 'vet', name: 'Veterinario', description: 'Consultas y más' },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<ServicesScreen />);
    await waitFor(() => expect(getByTestId('services.category.cat_grooming')).toBeTruthy());

    fireEvent.press(getByTestId('services.category.cat_grooming'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/services/cat_grooming');
  });

  it('muestra el estado vacío cuando no hay categorías', async () => {
    mockedUseServiceCatalog.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<ServicesScreen />);
    await waitFor(() => expect(getByTestId('services.empty')).toBeTruthy());
  });

  it('muestra el banner de error con reintentar', async () => {
    const refetch = jest.fn();
    mockedUseServiceCatalog.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
      refetch,
    } as never);

    const { getByTestId, getByText } = render(<ServicesScreen />);
    await waitFor(() => expect(getByTestId('services.error')).toBeTruthy());

    fireEvent.press(getByText('Reintentar'));
    expect(refetch).toHaveBeenCalled();
  });

  it('modo invitado: "Mis reservas" abre el modal de login en vez de navegar', () => {
    useAuthStore.setState({ isGuest: true });
    mockedUseServiceCatalog.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<ServicesScreen />);
    fireEvent.press(getByTestId('services.myBookings'));

    expect(mockPush).not.toHaveBeenCalledWith('/(app)/services/bookings');
    expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();
  });
});
