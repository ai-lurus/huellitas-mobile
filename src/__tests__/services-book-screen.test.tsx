import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../stores/authStore';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ categoryId: 'cat_grooming', providerId: 'prov_1' }),
}));

jest.mock('../hooks/useServices', () => ({
  useServiceDetail: jest.fn(),
  useCreateBookingMutation: jest.fn(),
}));

jest.mock('../hooks/usePets', () => ({
  usePets: jest.fn(),
}));

import BookServiceScreen from '../../app/(app)/services/[categoryId]/book';
import { useCreateBookingMutation, useServiceDetail } from '../hooks/useServices';
import { usePets } from '../hooks/usePets';

const mockedUseServiceDetail = jest.mocked(useServiceDetail);
const mockedUseCreateBookingMutation = jest.mocked(useCreateBookingMutation);
const mockedUsePets = jest.mocked(usePets);

function groomingDetail(overrides: Record<string, unknown> = {}): unknown {
  return {
    id: 'svc_1',
    categoryId: 'cat_grooming',
    categoryKey: 'grooming',
    name: 'Baño y corte',
    providerId: 'prov_1',
    includes: [],
    availableSlots: ['2026-07-10T15:00:00.000Z', '2026-07-10T16:00:00.000Z'],
    occupiedSlots: ['2026-07-10T16:00:00.000Z'],
    deliveryWindows: [],
    products: [],
    ...overrides,
  };
}

describe('Solicitar servicio (§6.3)', () => {
  const mutateAsync = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue(undefined);
    mockedUseCreateBookingMutation.mockReturnValue({ mutateAsync } as never);
    mockedUsePets.mockReturnValue({ pets: [{ id: 'pet_1', name: 'Max' }] } as never);
  });

  it('exige seleccionar mascota antes de habilitar el envío para un servicio que la requiere', async () => {
    mockedUseServiceDetail.mockReturnValue({ data: groomingDetail() } as never);

    const { getByTestId } = render(<BookServiceScreen />);
    await waitFor(() => expect(getByTestId('services.book.submit')).toBeTruthy());

    expect(getByTestId('services.book.submit').props.accessibilityState?.disabled).toBe(true);
  });

  it('deshabilita un horario ya ocupado y no permite doble booking', async () => {
    mockedUseServiceDetail.mockReturnValue({ data: groomingDetail() } as never);

    const { getByTestId } = render(<BookServiceScreen />);
    await waitFor(() =>
      expect(getByTestId('services.book.slots.slot.2026-07-10T16:00:00.000Z')).toBeTruthy(),
    );

    expect(
      getByTestId('services.book.slots.slot.2026-07-10T16:00:00.000Z').props.accessibilityState
        ?.disabled,
    ).toBe(true);
  });

  it('completa mascota + horario y envía la solicitud', async () => {
    mockedUseServiceDetail.mockReturnValue({ data: groomingDetail() } as never);

    const { getByTestId } = render(<BookServiceScreen />);
    await waitFor(() => expect(getByTestId('services.book.pet.pet_1')).toBeTruthy());

    fireEvent.press(getByTestId('services.book.pet.pet_1'));
    fireEvent.press(getByTestId('services.book.slots.slot.2026-07-10T15:00:00.000Z'));
    fireEvent.press(getByTestId('services.book.submit'));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    const call = mutateAsync.mock.calls[0][0] as { petId: string; scheduledAt: string };
    expect(call.petId).toBe('pet_1');
    expect(call.scheduledAt).toBe('2026-07-10T15:00:00.000Z');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)/services/bookings'));
  });

  it('Croquetas omite la selección de mascota y usa carrito + dirección', async () => {
    mockedUseServiceDetail.mockReturnValue({
      data: groomingDetail({
        categoryKey: 'kibble',
        name: 'Croquetas a domicilio',
        availableSlots: [],
        occupiedSlots: [],
        deliveryWindows: ['Hoy 4-7pm'],
        products: [{ id: 'prod_1', name: 'Croquetas 3kg', priceLabel: '$250' }],
      }),
    } as never);

    const { getByTestId, queryByTestId } = render(<BookServiceScreen />);
    await waitFor(() => expect(getByTestId('services.book.cart.prod_1.plus')).toBeTruthy());

    expect(queryByTestId('services.book.pet.pet_1')).toBeNull();
    expect(getByTestId('services.book.submit').props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(getByTestId('services.book.cart.prod_1.plus'));
    fireEvent.press(getByTestId('services.book.window.Hoy 4-7pm'));
    fireEvent.changeText(getByTestId('services.book.address'), 'Calle Falsa 123');

    await waitFor(() =>
      expect(getByTestId('services.book.submit').props.accessibilityState?.disabled).toBe(false),
    );
  });

  it('modo invitado: el envío abre el modal de login en vez de crear la reserva', async () => {
    useAuthStore.setState({ isGuest: true });
    mockedUseServiceDetail.mockReturnValue({ data: groomingDetail() } as never);

    const { getByTestId } = render(<BookServiceScreen />);
    await waitFor(() => expect(getByTestId('services.book.pet.pet_1')).toBeTruthy());

    fireEvent.press(getByTestId('services.book.pet.pet_1'));
    fireEvent.press(getByTestId('services.book.slots.slot.2026-07-10T15:00:00.000Z'));
    fireEvent.press(getByTestId('services.book.submit'));

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(getByTestId('authRequiredModal.signIn')).toBeTruthy();

    useAuthStore.setState({ isGuest: false });
  });
});
