import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

import { AuthRequiredModal } from './AuthRequiredModal';

describe('AuthRequiredModal', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('no renderiza contenido cuando visible es false', () => {
    const { queryByTestId } = render(<AuthRequiredModal visible={false} onClose={jest.fn()} />);
    expect(queryByTestId('authRequiredModal.signIn')).toBeNull();
  });

  it('navega a sign-in y cierra el modal al tocar "Iniciar sesión"', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<AuthRequiredModal visible onClose={onClose} />);

    fireEvent.press(getByTestId('authRequiredModal.signIn'));

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
  });

  it('navega a sign-up y cierra el modal al tocar "Crear cuenta"', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<AuthRequiredModal visible onClose={onClose} />);

    fireEvent.press(getByTestId('authRequiredModal.signUp'));

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-up');
  });

  it('cierra el modal al tocar el backdrop', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(<AuthRequiredModal visible onClose={onClose} />);

    fireEvent.press(getByTestId('authRequiredModal.backdrop'));

    expect(onClose).toHaveBeenCalled();
  });
});
