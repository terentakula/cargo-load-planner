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

export const PACKING_ENGINE_VERSION = '0.1.0'