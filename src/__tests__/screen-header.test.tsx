import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (): null => null,
}));

import { ScreenHeader } from '../components/navigation/ScreenHeader';

describe('ScreenHeader', () => {
  it('modo root: sin onBack, no muestra botón de volver y renderiza rightSlot', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <ScreenHeader
        title="Mis mascotas"
        rightSlot={<Text testID="root.action">Acción</Text>}
        testID="header"
      />,
    );

    expect(getByText('Mis mascotas')).toBeTruthy();
    expect(queryByTestId('header.back')).toBeNull();
    expect(getByTestId('root.action')).toBeTruthy();
  });

  it('modo detail: con onBack, el botón de volver lo invoca al presionarlo', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <ScreenHeader title="Editar mascota" onBack={onBack} testID="header" />,
    );

    fireEvent.press(getByTestId('header.back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(getByTestId('header.title').props.children).toBe('Editar mascota');
  });

  it('modo detail: sin rightSlot, no rompe el layout (spacer implícito)', () => {
    const { queryByTestId } = render(
      <ScreenHeader title="Notificaciones" onBack={jest.fn()} testID="header" />,
    );
    expect(queryByTestId('header.rightSlot')).toBeNull();
  });

  it('modo detail: con rightSlot, lo renderiza en vez del spacer', () => {
    const { getByTestId } = render(
      <ScreenHeader
        title="Reporte de avistamiento"
        onBack={jest.fn()}
        rightSlot={<Text testID="detail.action">Enviar</Text>}
        testID="header"
      />,
    );
    expect(getByTestId('detail.action')).toBeTruthy();
  });
});
