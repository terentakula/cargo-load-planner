import type {
  CargoOrientation,
  CargoTemplate,
} from '../model/types'

export type OrientedCargoSize = {
  xMm: number
  yMm: number
  zMm: number
}

export function getOrientedCargoSize(
  cargoTemplate: CargoTemplate,
  orientation: CargoOrientation,
): OrientedCargoSize {
  const x = cargoTemplate.lengthMm
  const y = cargoTemplate.heightMm
  const z = cargoTemplate.widthMm

  switch (orientation) {
    case 'XYZ':
      return { xMm: x, yMm: y, zMm: z }

    case 'XZY':
      return { xMm: x, yMm: z, zMm: y }

    case 'YXZ':
      return { xMm: y, yMm: x, zMm: z }

    case 'YZX':
      return { xMm: y, yMm: z, zMm: x }

    case 'ZXY':
      return { xMm: z, yMm: x, zMm: y }

    case 'ZYX':
      return { xMm: z, yMm: y, zMm: x }

    default: {
      const exhaustiveCheck: never = orientation
      return exhaustiveCheck
    }
  }
}