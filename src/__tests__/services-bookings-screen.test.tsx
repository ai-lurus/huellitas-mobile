import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('../hooks/useServices', () => ({
  useMyBookings: jest.fn(),
  useCancelBookingMutation: jest.fn(),
}));

import MyBookingsScreen from '../../app/(app)/services/bookings';
import { useCancelBookingMutation, useMyBookings } from '../hooks/useServices';

const mockedUseMyBookings = jest.mocked(useMyBookings);
const mockedUseCancelBookingMutation = jest.mocked(useCancelBookingMutation);

describe('Mis reservas (§6.3.1)', () => {
  const mutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCancelBookingMutation.mockReturnValue({ mutate } as never);
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  it('muestra el estado vacío cuando no hay reservas', async () => {
    mockedUseMyBookings.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<MyBookingsScreen />);
    await waitFor(() => expect(getByTestId('services.bookings.empty')).toBeTruthy());
  });

  it('fuera del umbral de 2 horas, confirma y cancela la reserva', async () => {
    const inThreeHours = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    mockedUseMyBookings.mockReturnValue({
      data: [
        {
          id: 'booking_1',
          serviceId: 'svc_1',
          serviceName: 'Baño y corte',
          categoryKey: 'grooming',
          status: 'confirmed',
          scheduledAt: inThreeHours,
          createdAt: inThreeHours,
        },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<MyBookingsScreen />);
    await waitFor(() => expect(getByTestId('services.bookings.cancel.booking_1')).toBeTruthy());

    fireEvent.press(getByTestId('services.bookings.cancel.booking_1'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '¿Cancelar reserva?',
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({ text: 'Sí, cancelar' })]),
    );

    const alertMock = jest.mocked(Alert.alert).mock.calls[0];
    const confirmOption = (alertMock[2] as { text: string; onPress?: () => void }[]).find(
      (o) => o.text === 'Sí, cancelar',
    );
    confirmOption?.onPress?.();

    expect(mutate).toHaveBeenCalledWith('booking_1');
  });

  it('dentro del umbral de 2 horas, no permite auto-cancelar', async () => {
    const inOneHour = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
    mockedUseMyBookings.mockReturnValue({
      data: [
        {
          id: 'booking_2',
          serviceId: 'svc_1',
          serviceName: 'Baño y corte',
          categoryKey: 'grooming',
          status: 'confirmed',
          scheduledAt: inOneHour,
          createdAt: inOneHour,
        },
      ],
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    } as never);

    const { getByTestId } = render(<MyBookingsScreen />);
    await waitFor(() => expect(getByTestId('services.bookings.cancel.booking_2')).toBeTruthy());

    fireEvent.press(getByTestId('services.bookings.cancel.booking_2'));

    expect(Alert.alert).toHaveBeenCalledWith('No se puede cancelar', expect.any(String));
    expect(mutate).not.toHaveBeenCalled();
  });
});
