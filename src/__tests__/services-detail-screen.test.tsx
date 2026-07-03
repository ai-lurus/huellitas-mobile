import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ categoryId: 'cat_grooming' }),
}));

jest.mock('../hooks/useServices', () => ({
  useServiceDetail: jest.fn(),
  useServiceProviders: jest.fn(),
}));

import ServiceDetailScreen from '../../app/(app)/services/[categoryId]/index';
import { useServiceDetail, useServiceProviders } from '../hooks/useServices';

const mockedUseServiceDetail = jest.mocked(useServiceDetail);
const mockedUseServiceProviders = jest.mocked(useServiceProviders);

describe('Detalle de servicio (§6.2)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('con un único proveedor en la zona, muestra el detalle directamente y permite solicitar', async () => {
    mockedUseServiceProviders.mockReturnValue({
      data: [{ id: 'prov_1', name: 'Pet Spa' }],
      isPending: false,
    } as never);
    mockedUseServiceDetail.mockReturnValue({
      data: {
        id: 'svc_1',
        categoryId: 'cat_grooming',
        categoryKey: 'grooming',
        name: 'Baño y corte',
        description: 'Servicio completo',
        includes: ['Baño premium', 'Corte de uñas'],
        providerId: 'prov_1',
        providerName: 'Pet Spa',
        availableSlots: [],
        occupiedSlots: [],
        deliveryWindows: [],
        products: [],
      },
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId, getByText } = render(<ServiceDetailScreen />);
    await waitFor(() => expect(getByTestId('services.detail.content')).toBeTruthy());
    expect(getByText('Baño premium')).toBeTruthy();

    fireEvent.press(getByTestId('services.detail.request'));
    expect(mockPush).toHaveBeenCalledWith('/(app)/services/cat_grooming/book?providerId=prov_1');
  });

  it('con más de un proveedor y sin selección, redirige a la pantalla de selección', async () => {
    mockedUseServiceProviders.mockReturnValue({
      data: [
        { id: 'prov_1', name: 'Pet Spa' },
        { id: 'prov_2', name: 'Groom House' },
      ],
      isPending: false,
    } as never);
    mockedUseServiceDetail.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: jest.fn(),
    } as never);

    render(<ServiceDetailScreen />);
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('/(app)/services/cat_grooming/providers'),
    );
  });
});
