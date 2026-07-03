jest.mock('../../../assets/icons/plaka/carnet-id.svg', () => ({
  __esModule: true,
  default: 'CarnetIdIcon',
}));
jest.mock('../../../assets/icons/plaka/radar.svg', () => ({
  __esModule: true,
  default: 'RadarIcon',
}));
jest.mock('../../../assets/icons/plaka/tarea-hecha.svg', () => ({
  __esModule: true,
  default: 'TareaHechaIcon',
}));
jest.mock('../../../assets/icons/plaka/contacto.svg', () => ({
  __esModule: true,
  default: 'ContactoIcon',
}));
jest.mock('../../../assets/icons/plaka/extraviado.svg', () => ({
  __esModule: true,
  default: 'ExtraviadoIcon',
}));
jest.mock('../../../assets/icons/plaka/puntos.svg', () => ({
  __esModule: true,
  default: 'PuntosIcon',
}));

import React from 'react';
import { render } from '@testing-library/react-native';

import { PlakaIcon, type PlakaIconName } from './PlakaIcon';

const CASES: Array<[PlakaIconName, string]> = [
  ['carnet-id', 'CarnetIdIcon'],
  ['radar', 'RadarIcon'],
  ['tarea-hecha', 'TareaHechaIcon'],
  ['contacto', 'ContactoIcon'],
  ['extraviado', 'ExtraviadoIcon'],
  ['puntos', 'PuntosIcon'],
];

describe('PlakaIcon', () => {
  it.each(CASES)('renders the %s icon with the given size and color', (name, elementType) => {
    const { UNSAFE_getByType } = render(<PlakaIcon name={name} size={30} color="#0B5369" />);

    const icon = UNSAFE_getByType(elementType as never);
    expect(icon.props.width).toBe(30);
    expect(icon.props.height).toBe(30);
    expect(icon.props.color).toBe('#0B5369');
  });

  it('defaults size to 22 when not provided', () => {
    const { UNSAFE_getByType } = render(<PlakaIcon name="radar" color="#000000" />);

    expect(UNSAFE_getByType('RadarIcon' as never).props.width).toBe(22);
  });
});
