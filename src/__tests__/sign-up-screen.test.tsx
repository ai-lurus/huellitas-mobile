import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

import SignUpScreen from '../../app/(auth)/sign-up';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

jest.mock('../services/authService');

jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: jest.fn() }),
  },
}));

const { authService } = jest.requireMock('../services/authService') as {
  authService: { signUp: jest.Mock };
};

const defaultSignUpResult = {
  user: { id: '1', name: 'Ana García', email: 'ana@ejemplo.com' },
  isFirstLogin: true,
};

describe('SignUpScreen', () => {
  jest.setTimeout(25000);

  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
    authService.signUp.mockReset();
    authService.signUp.mockResolvedValue(defaultSignUpResult);
  });

  it('navega a onboarding step-1 tras registro exitoso', async () => {
    const { getByTestId } = render(<SignUpScreen />);

    fireEvent.changeText(getByTestId('signUp.name'), 'Ana García');
    fireEvent.changeText(getByTestId('signUp.email'), 'ana@ejemplo.com');
    fireEvent.changeText(getByTestId('signUp.password'), 'password123');
    fireEvent.changeText(getByTestId('signUp.confirmPassword'), 'password123');
    fireEvent.press(getByTestId('signUp.terms'));
    fireEvent.press(getByTestId('signUp.submit'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/onboarding/step-1');
    });
  });

  it('navega a inicio de sesión al pulsar el enlace', () => {
    const { getByTestId } = render(<SignUpScreen />);

    fireEvent.press(getByTestId('signUp.signIn'));

    expect(mockPush).toHaveBeenCalledWith('/(auth)/sign-in');
  });
});
