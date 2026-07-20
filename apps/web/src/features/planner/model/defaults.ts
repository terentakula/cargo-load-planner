import type { CargoSpace } from './types'

export const DEFAULT_CARGO_SPACE: CargoSpace = {
  id: 'default-semitrailer',
  name: 'Стандартный полуприцеп',
  type: 'truck',
  lengthMm: 13_600,
  widthMm: 2_450,
  heightMm: 2_700,
  maxWeightKg: 24_000,
}
