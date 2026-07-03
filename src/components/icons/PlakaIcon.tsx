import React from 'react';
import type { SvgProps } from 'react-native-svg';

import CarnetIdIcon from '../../../assets/icons/plaka/carnet-id.svg';
import RadarIcon from '../../../assets/icons/plaka/radar.svg';
import TareaHechaIcon from '../../../assets/icons/plaka/tarea-hecha.svg';
import ContactoIcon from '../../../assets/icons/plaka/contacto.svg';
import ExtraviadoIcon from '../../../assets/icons/plaka/extraviado.svg';
import PuntosIcon from '../../../assets/icons/plaka/puntos.svg';

export type PlakaIconName =
  | 'carnet-id'
  | 'radar'
  | 'tarea-hecha'
  | 'contacto'
  | 'extraviado'
  | 'puntos';

const ICONS: Record<PlakaIconName, React.FC<SvgProps>> = {
  'carnet-id': CarnetIdIcon,
  radar: RadarIcon,
  'tarea-hecha': TareaHechaIcon,
  contacto: ContactoIcon,
  extraviado: ExtraviadoIcon,
  puntos: PuntosIcon,
};

export type PlakaIconProps = {
  name: PlakaIconName;
  size?: number;
  color: string;
};

export function PlakaIcon({ name, size = 22, color }: PlakaIconProps): React.ReactElement {
  const Icon = ICONS[name];
  return <Icon width={size} height={size} color={color} />;
}
