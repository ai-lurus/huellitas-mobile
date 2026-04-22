import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { PetForm } from './PetForm';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
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

describe('PetForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true });
  });

  it('renderiza campos principales y botones', () => {
    const { getByTestId } = render(
      <PetForm onSubmit={jest.fn()} onCancel={jest.fn()} isSubmitting={false} />,
    );

    expect(getByTestId('petForm.name')).toBeTruthy();
    expect(getByTestId('petForm.species')).toBeTruthy();
    expect(getByTestId('petForm.sex')).toBeTruthy();
    expect(getByTestId('petForm.photo.add')).toBeTruthy();
    expect(getByTestId('petForm.submit')).toBeTruthy();
    expect(getByTestId('petForm.cancel')).toBeTruthy();
  });

  it('muestra error de validación si falta nombre', async () => {
    const { getByTestId, findByText } = render(
      <PetForm onSubmit={jest.fn()} onCancel={jest.fn()} isSubmitting={false} />,
    );

    fireEvent.press(getByTestId('petForm.submit'));
    expect(await findByText('El nombre es obligatorio')).toBeTruthy();
  });

  it('permite agregar hasta 5 fotos y eliminar', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.jpg' }, { uri: 'file:///tmp/b.jpg' }],
    });

    const { getByTestId, findByTestId, queryByTestId } = render(
      <PetForm onSubmit={jest.fn()} onCancel={jest.fn()} isSubmitting={false} />,
    );

    fireEvent.press(getByTestId('petForm.photo.add'));

    expect(await findByTestId('petForm.photo.remove.0')).toBeTruthy();
    expect(await findByTestId('petForm.photo.remove.1')).toBeTruthy();

    fireEvent.press(getByTestId('petForm.photo.remove.0'));
    await waitFor(() => {
      expect(queryByTestId('petForm.photo.remove.0')).toBeTruthy();
      expect(queryByTestId('petForm.photo.remove.1')).toBeNull();
    });
  });

  it('cambia especie al pulsar el icono correspondiente', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <PetForm onSubmit={onSubmit} onCancel={jest.fn()} isSubmitting={false} />,
    );

    fireEvent.changeText(getByTestId('petForm.name'), 'Luna');
    fireEvent.press(getByTestId('petForm.species.cat'));
    fireEvent.press(getByTestId('petForm.submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Luna', species: 'cat' }),
      );
    });
  });

  it('envía el payload incluyendo fotos en submit', async () => {
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.jpg' }],
    });

    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <PetForm onSubmit={onSubmit} onCancel={jest.fn()} isSubmitting={false} />,
    );

    fireEvent.changeText(getByTestId('petForm.name'), 'Max');
    fireEvent.press(getByTestId('petForm.photo.add'));

    await waitFor(() => {
      expect(getByTestId('petForm.photo.remove.0')).toBeTruthy();
    });

    fireEvent.press(getByTestId('petForm.submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Max',
          photos: ['file:///tmp/a.jpg'],
        }),
      );
    });
  });
});
