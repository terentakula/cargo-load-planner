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

export type CargoRotationAxis = 'x' | 'y' | 'z'

export function getRotatedCargoOrientation(
  orientation: CargoOrientation,
  axis: CargoRotationAxis,
): CargoOrientation {
  const dimensions = orientation.split('')

  switch (axis) {
    case 'x':
      return [
        dimensions[0],
        dimensions[2],
        dimensions[1],
      ].join('') as CargoOrientation

    case 'y':
      return [
        dimensions[2],
        dimensions[1],
        dimensions[0],
      ].join('') as CargoOrientation

    case 'z':
      return [
        dimensions[1],
        dimensions[0],
        dimensions[2],
      ].join('') as CargoOrientation
  }
}