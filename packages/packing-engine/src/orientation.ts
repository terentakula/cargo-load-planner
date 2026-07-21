import type {
  CargoOrientation,
  CargoTemplate,
} from './model/types'

export type OrientedCargoSize = {
  xMm: number
  yMm: number
  zMm: number
}

export type CargoRotationAxis = 'x' | 'y' | 'z'

export function getOrientedCargoSize(
  cargoTemplate: CargoTemplate,
  orientation: CargoOrientation,
): OrientedCargoSize {
  const {
    lengthMm,
    widthMm,
    heightMm,
  } = cargoTemplate

  switch (orientation) {
    case 'XYZ':
      return {
        xMm: lengthMm,
        yMm: heightMm,
        zMm: widthMm,
      }

    case 'XZY':
      return {
        xMm: lengthMm,
        yMm: widthMm,
        zMm: heightMm,
      }

    case 'YXZ':
      return {
        xMm: heightMm,
        yMm: lengthMm,
        zMm: widthMm,
      }

    case 'YZX':
      return {
        xMm: heightMm,
        yMm: widthMm,
        zMm: lengthMm,
      }

    case 'ZXY':
      return {
        xMm: widthMm,
        yMm: lengthMm,
        zMm: heightMm,
      }

    case 'ZYX':
      return {
        xMm: widthMm,
        yMm: heightMm,
        zMm: lengthMm,
      }
  }
}

export function getRotatedCargoOrientation(
  orientation: CargoOrientation,
  axis: CargoRotationAxis,
): CargoOrientation {
  const orientationAxes = orientation.split('')

  const axisPermutation: Record<
    CargoRotationAxis,
    [number, number, number]
  > = {
    x: [0, 2, 1],
    y: [2, 1, 0],
    z: [1, 0, 2],
  }

  const permutation = axisPermutation[axis]

  return permutation
    .map((index) => orientationAxes[index])
    .join('') as CargoOrientation
}