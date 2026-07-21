export type {
  CargoOrientation,
  CargoPosition,
  CargoSpace,
  CargoSpaceType,
  CargoTemplate,
  PlacedCargo,
} from './model/types'

export {
  getOrientedCargoSize,
  getRotatedCargoOrientation,
} from './orientation'

export type {
  CargoRotationAxis,
  OrientedCargoSize,
} from './orientation'

export {
  getCargoTopLoadKg,
  isCargoStackValid,
} from './load'

export {
  cargoBoundsIntersect,
  getCargoBounds,
  isCargoPositionAvailable,
} from './collision'

export type {
  CargoBounds,
  PositionValidationInput,
} from './collision'

export {
  getSupportedCargoPosition,
  isCargoSupportingAnotherCargo,
} from './support'

export const PACKING_ENGINE_VERSION = '0.1.0'