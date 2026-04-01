import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { SignInForm } from './SignInForm';
import { authService } from '../../services/authService';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

jest.mock('../../services/authService');

jest.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ setUser: jest.fn() }),
  },
}));

describe('SignInForm', () => {
  it('renders email, password, and submit button', () => {
    const { getByTestId } = render(<SignInForm onSuccess={jest.fn()} />);

    expect(getByTestId('signIn.email')).toBeTruthy();
    expect(getByTestId('signIn.password')).toBeTruthy();
    expect(getByTestId('signIn.submit')).toBeTruthy();
  });

  it('shows validation errors for empty fields', async () => {
    const { getByTestId, findByText } = render(<SignInForm onSuccess={jest.fn()} />);

    fireEvent.press(getByTestId('signIn.submit'));

    expect(await findByText('El correo electrónico es obligatorio')).toBeTruthy();
    expect(await findByText('La contraseña es obligatoria')).toBeTruthy();
  });

  it('shows validation error for invalid email', async () => {
    const { getByTestId, getByText, queryByText } = render(<SignInForm onSuccess={jest.fn()} />);

    fireEvent.changeText(getByTestId('signIn.email'), 'not-an-email');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    await waitFor(() => {
      expect(getByText('Correo electrónico no válido')).toBeTruthy();
      expect(queryByText('La contraseña es obligatoria')).toBeNull();
    });
  });

  it('calls authService.signIn on valid submit', async () => {
    jest.mocked(authService.signIn).mockImplementationOnce(async () => ({
      user: { id: '1', name: 'Test', email: 'a@b.com' },
      isFirstLogin: false,
    }));

    const onSuccess = jest.fn();
    const { getByTestId } = render(<SignInForm onSuccess={onSuccess} />);

    fireEvent.changeText(getByTestId('signIn.email'), 'a@b.com');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    await waitFor(() => {
      expect(authService.signIn).toHaveBeenCalledWith('a@b.com', 'password123');
      expect(onSuccess).toHaveBeenCalledWith({ isFirstLogin: false });
    });
  });

  it('calls onSuccess with isFirstLogin true when API returns first login', async () => {
    jest.mocked(authService.signIn).mockImplementationOnce(async () => ({
      user: { id: '1', name: 'Test', email: 'a@b.com' },
      isFirstLogin: true,
    }));

    const onSuccess = jest.fn();
    const { getByTestId } = render(<SignInForm onSuccess={onSuccess} />);

    fireEvent.changeText(getByTestId('signIn.email'), 'a@b.com');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith({ isFirstLogin: true });
    });
  });

  it('shows loading indicator and disables submit while signing in', async () => {
    let resolveSignIn!: (value: Awaited<ReturnType<typeof authService.signIn>>) => void;
    const signInPromise = new Promise<Awaited<ReturnType<typeof authService.signIn>>>((resolve) => {
      resolveSignIn = resolve;
    });
    jest.mocked(authService.signIn).mockImplementationOnce(() => signInPromise);

    const { getByTestId } = render(<SignInForm onSuccess={jest.fn()} />);

    fireEvent.changeText(getByTestId('signIn.email'), 'a@b.com');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    expect(getByTestId('signIn.loading')).toBeTruthy();
    expect(getByTestId('signIn.submit')).toBeDisabled();

    resolveSignIn({
      user: { id: '1', name: 'Test', email: 'a@b.com' },
      isFirstLogin: false,
    });
    await waitFor(() => {
      expect(getByTestId('signIn.submit')).not.toBeDisabled();
    });
  });

  it('calls onGooglePress when Google button is pressed', () => {
    const onGooglePress = jest.fn();
    const { getByTestId } = render(
      <SignInForm onSuccess={jest.fn()} onGooglePress={onGooglePress} />,
    );

    fireEvent.press(getByTestId('signIn.google'));
    expect(onGooglePress).toHaveBeenCalled();
  });

  it('calls onSignUpPress when register link is pressed', () => {
    const onSignUpPress = jest.fn();
    const { getByTestId } = render(
      <SignInForm onSuccess={jest.fn()} onSignUpPress={onSignUpPress} />,
    );

    fireEvent.press(getByTestId('signIn.signUp'));
    expect(onSignUpPress).toHaveBeenCalled();
  });

  it('shows API error on failure', async () => {
    jest
      .mocked(authService.signIn)
      .mockImplementationOnce(() => Promise.reject(new Error('Invalid credentials')));

    const { getByTestId, findByText } = render(<SignInForm onSuccess={jest.fn()} />);

    fireEvent.changeText(getByTestId('signIn.email'), 'a@b.com');
    fireEvent.changeText(getByTestId('signIn.password'), 'password123');
    fireEvent.press(getByTestId('signIn.submit'));

    expect(
      await findByText('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.'),
    ).toBeTruthy();
  });
});
