import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { SignUpForm } from './SignUpForm';
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

describe('SignUpForm', () => {
  const fillValidForm = (getByTestId: (id: string) => unknown): void => {
    fireEvent.changeText(getByTestId('signUp.name'), 'Ana García');
    fireEvent.changeText(getByTestId('signUp.email'), 'ana@ejemplo.com');
    fireEvent.changeText(getByTestId('signUp.password'), 'password123');
    fireEvent.changeText(getByTestId('signUp.confirmPassword'), 'password123');
  };

  it('renderiza nombre, correo, contraseñas, términos y enviar', () => {
    const { getByTestId, getByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    expect(getByTestId('signUp.name')).toBeTruthy();
    expect(getByTestId('signUp.email')).toBeTruthy();
    expect(getByTestId('signUp.password')).toBeTruthy();
    expect(getByTestId('signUp.confirmPassword')).toBeTruthy();
    expect(getByTestId('signUp.terms')).toBeTruthy();
    expect(getByTestId('signUp.submit')).toBeTruthy();
    expect(getByText('Crear cuenta')).toBeTruthy();
  });

  it('muestra errores de validación con campos vacíos', async () => {
    const { getByTestId, findByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    fireEvent.press(getByTestId('signUp.submit'));

    expect(await findByText('El nombre es obligatorio')).toBeTruthy();
  });

  it('valida correo electrónico', async () => {
    const { getByTestId, findByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    fillValidForm(getByTestId);
    fireEvent.changeText(getByTestId('signUp.email'), 'no-es-correo');
    fireEvent.press(getByTestId('signUp.submit'));

    expect(await findByText('Ingresa un correo electrónico válido')).toBeTruthy();
  });

  it('exige contraseña de al menos 8 caracteres', async () => {
    const { getByTestId, findByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    fireEvent.changeText(getByTestId('signUp.name'), 'Ana García');
    fireEvent.changeText(getByTestId('signUp.email'), 'ana@ejemplo.com');
    fireEvent.changeText(getByTestId('signUp.password'), 'short');
    fireEvent.changeText(getByTestId('signUp.confirmPassword'), 'short');
    fireEvent.press(getByTestId('signUp.terms'));
    fireEvent.press(getByTestId('signUp.submit'));

    expect(await findByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy();
  });

  it('muestra error si las contraseñas no coinciden', async () => {
    const { getByTestId, findByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    fireEvent.changeText(getByTestId('signUp.name'), 'Ana García');
    fireEvent.changeText(getByTestId('signUp.email'), 'ana@ejemplo.com');
    fireEvent.changeText(getByTestId('signUp.password'), 'password123');
    fireEvent.changeText(getByTestId('signUp.confirmPassword'), 'password456');
    fireEvent.press(getByTestId('signUp.terms'));
    fireEvent.press(getByTestId('signUp.submit'));

    expect(await findByText('Las contraseñas no coinciden')).toBeTruthy();
  });

  it('exige aceptar términos', async () => {
    const { getByTestId, findByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    fillValidForm(getByTestId);
    fireEvent.press(getByTestId('signUp.submit'));

    expect(await findByText('Debes aceptar los términos de servicio')).toBeTruthy();
  });

  it('llama a authService.signUp con datos válidos', async () => {
    jest.mocked(authService.signUp).mockResolvedValueOnce({
      user: { id: '1', name: 'Ana García', email: 'ana@ejemplo.com' },
      isFirstLogin: true,
    });

    const onSuccess = jest.fn();
    const { getByTestId } = render(<SignUpForm onSuccess={onSuccess} />);

    fillValidForm(getByTestId);
    fireEvent.press(getByTestId('signUp.terms'));
    fireEvent.press(getByTestId('signUp.submit'));

    await waitFor(() => {
      expect(authService.signUp).toHaveBeenCalledWith(
        'Ana García',
        'ana@ejemplo.com',
        'password123',
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('muestra indicador de carga y deshabilita enviar mientras carga', async () => {
    let resolveSignUp!: (value: Awaited<ReturnType<typeof authService.signUp>>) => void;
    const signUpPromise = new Promise<Awaited<ReturnType<typeof authService.signUp>>>((resolve) => {
      resolveSignUp = resolve;
    });
    jest.mocked(authService.signUp).mockImplementationOnce(() => signUpPromise);

    const { getByTestId } = render(<SignUpForm onSuccess={jest.fn()} />);

    fillValidForm(getByTestId);
    fireEvent.press(getByTestId('signUp.terms'));
    fireEvent.press(getByTestId('signUp.submit'));

    expect(getByTestId('signUp.loading')).toBeTruthy();
    expect(getByTestId('signUp.submit')).toBeDisabled();

    resolveSignUp({
      user: { id: '1', name: 'Ana García', email: 'ana@ejemplo.com' },
      isFirstLogin: true,
    });
    await waitFor(() => {
      expect(getByTestId('signUp.submit')).not.toBeDisabled();
    });
  });

  it('muestra error si la API falla', async () => {
    jest.mocked(authService.signUp).mockRejectedValueOnce(new Error('Correo ya registrado'));

    const { getByTestId, findByText } = render(<SignUpForm onSuccess={jest.fn()} />);

    fillValidForm(getByTestId);
    fireEvent.press(getByTestId('signUp.terms'));
    fireEvent.press(getByTestId('signUp.submit'));

    expect(await findByText('Correo ya registrado')).toBeTruthy();
  });

  it('llama onSignInPress al pulsar Inicia sesión', () => {
    const onSignInPress = jest.fn();
    const { getByTestId } = render(
      <SignUpForm onSuccess={jest.fn()} onSignInPress={onSignInPress} />,
    );

    fireEvent.press(getByTestId('signUp.signIn'));
    expect(onSignInPress).toHaveBeenCalled();
  });
});
