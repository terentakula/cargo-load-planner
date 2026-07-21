import {
  describe,
  expect,
  it,
} from 'vitest'
import type {
  CargoOrientation,
  CargoTemplate,
} from './model/types'
import {
  getOrientedCargoSize,
  getRotatedCargoOrientation,
  type OrientedCargoSize,
} from './orientation'

const cargoTemplate: CargoTemplate = {
  id: 'test-template',
  sku: 'TEST',
  name: 'Тестовый груз',
  lengthMm: 1200,
  widthMm: 800,
  heightMm: 600,
  weightKg: 150,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 300,
}

const orientationCases: Array<
  [CargoOrientation, OrientedCargoSize]
> = [
  [
    'XYZ',
    {
      xMm: 1200,
      yMm: 600,
      zMm: 800,
    },
  ],
  [
    'XZY',
    {
      xMm: 1200,
      yMm: 800,
      zMm: 600,
    },
  ],
  [
    'YXZ',
    {
      xMm: 600,
      yMm: 1200,
      zMm: 800,
    },
  ],
  [
    'YZX',
    {
      xMm: 600,
      yMm: 800,
      zMm: 1200,
    },
  ],
  [
    'ZXY',
    {
      xMm: 800,
      yMm: 1200,
      zMm: 600,
    },
  ],
  [
    'ZYX',
    {
      xMm: 800,
      yMm: 600,
      zMm: 1200,
    },
  ],
]

describe('getOrientedCargoSize', () => {
  it.each(orientationCases)(
    'возвращает правильные размеры для %s',
    (orientation, expectedSize) => {
      expect(
        getOrientedCargoSize(
          cargoTemplate,
          orientation,
        ),
      ).toEqual(expectedSize)
    },
  )
})

describe('getRotatedCargoOrientation', () => {
  it('поворачивает XYZ вокруг оси X', () => {
    expect(
      getRotatedCargoOrientation('XYZ', 'x'),
    ).toBe('XZY')
  })

  it('поворачивает XYZ вокруг оси Y', () => {
    expect(
      getRotatedCargoOrientation('XYZ', 'y'),
    ).toBe('ZYX')
  })

  it('поворачивает XYZ вокруг оси Z', () => {
    expect(
      getRotatedCargoOrientation('XYZ', 'z'),
    ).toBe('YXZ')
  })

  it.each(['x', 'y', 'z'] as const)(
    'после двух поворотов вокруг оси %s возвращает исходные габариты',
    (axis) => {
      const firstOrientation =
        getRotatedCargoOrientation(
          'XYZ',
          axis,
        )

      const secondOrientation =
        getRotatedCargoOrientation(
          firstOrientation,
          axis,
        )

      expect(
        getOrientedCargoSize(
          cargoTemplate,
          secondOrientation,
        ),
      ).toEqual(
        getOrientedCargoSize(
          cargoTemplate,
          'XYZ',
        ),
      )
    },
  )
})