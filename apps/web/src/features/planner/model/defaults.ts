import type {
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './types'

export const DEFAULT_CARGO_SPACE: CargoSpace = {
  id: 'default-semitrailer',
  name: 'Стандартный полуприцеп',
  type: 'truck',
  lengthMm: 13_600,
  widthMm: 2_450,
  heightMm: 2_700,
  maxWeightKg: 24_000,
}

export const DEFAULT_CARGO_TEMPLATES: CargoTemplate[] = [
  {
    id: 'cargo-template-a',
    sku: 'BOX-A',
    name: 'Коробка A',
    lengthMm: 1_200,
    widthMm: 800,
    heightMm: 600,
    weightKg: 150,
    color: '#f59e0b',
    canBeTilted: true,
    stackable: true,
    maxTopLoadKg: 500,
  },
  {
    id: 'cargo-template-b',
    sku: 'BOX-B',
    name: 'Коробка B',
    lengthMm: 1_000,
    widthMm: 600,
    heightMm: 500,
    weightKg: 110,
    color: '#22c55e',
    canBeTilted: false,
    stackable: true,
    maxTopLoadKg: 300,
  },
  {
    id: 'cargo-template-c',
    sku: 'BOX-C',
    name: 'Коробка C',
    lengthMm: 800,
    widthMm: 600,
    heightMm: 400,
    weightKg: 75,
    color: '#8b5cf6',
    canBeTilted: true,
    stackable: false,
    maxTopLoadKg: null,
  },
]

export const DEFAULT_PLACED_CARGO: PlacedCargo[] = [
  {
    id: 'placed-cargo-a-1',
    templateId: 'cargo-template-a',
    position: {
      xMm: 0,
      yMm: 0,
      zMm: 0,
    },
    orientation: 'XYZ',
    locked: false,
  },
  {
    id: 'placed-cargo-b-1',
    templateId: 'cargo-template-b',
    position: {
      xMm: 1_250,
      yMm: 0,
      zMm: 0,
    },
    orientation: 'XYZ',
    locked: false,
  },
  {
    id: 'placed-cargo-c-1',
    templateId: 'cargo-template-c',
    position: {
      xMm: 0,
      yMm: 0,
      zMm: 850,
    },
    orientation: 'XYZ',
    locked: false,
  },
]