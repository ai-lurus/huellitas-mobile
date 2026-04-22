import type { PetSpecies } from '../../domain/pets';

/** Iconos de especie (estado normal / seleccionado) según diseño Figma. */
export const SPECIES_ICON_ASSETS: Record<PetSpecies, { default: number; selected: number }> = {
  dog: {
    default: require('../../../assets/pets/species/dog-default.png'),
    selected: require('../../../assets/pets/species/dog-selected.png'),
  },
  cat: {
    default: require('../../../assets/pets/species/cat-default.png'),
    selected: require('../../../assets/pets/species/cat-selected.png'),
  },
  bird: {
    default: require('../../../assets/pets/species/bird-default.png'),
    selected: require('../../../assets/pets/species/bird-selected.png'),
  },
  rabbit: {
    default: require('../../../assets/pets/species/rabbit-default.png'),
    selected: require('../../../assets/pets/species/rabbit-selected.png'),
  },
  other: {
    default: require('../../../assets/pets/species/other-default.png'),
    selected: require('../../../assets/pets/species/other-selected.png'),
  },
};

export const SPECIES_ORDER: readonly PetSpecies[] = [
  'dog',
  'cat',
  'bird',
  'rabbit',
  'other',
] as const;

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Ave',
  rabbit: 'Conejo',
  other: 'Otro',
};
