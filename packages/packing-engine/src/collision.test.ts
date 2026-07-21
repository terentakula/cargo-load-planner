import {
  describe,
  expect,
  it,
} from 'vitest'
import type {
  CargoOrientation,
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import { isCargoPositionAvailable } from './collision'

const cargoSpace: CargoSpace = {
  id: 'test-space',
  name: 'Тестовый кузов',
  type: 'truck',
  lengthMm: 13600,
  widthMm: 2450,
  heightMm: 2700,
  maxWeightKg: 24000,
}

const cargoTemplate: CargoTemplate = {
  id: 'template-standard',
  sku: 'STANDARD',
  name: 'Стандартный груз',
  lengthMm: 1200,
  widthMm: 800,
  heightMm: 600,
  weightKg: 150,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 300,
}

const createPlacedCargo = (): PlacedCargo[] => [
  {
    id: 'cargo-a',
    templateId: cargoTemplate.id,
    position: {
      xMm: 0,
      yMm: 0,
      zMm: 0,
    },
    orientation: 'XYZ',
    locked: false,
  },
  {
    id: 'cargo-b',
    templateId: cargoTemplate.id,
    position: {
      xMm: 3000,
      yMm: 0,
      zMm: 0,
    },
    orientation: 'XYZ',
    locked: false,
  },
]

function validateSecondCargoPosition(
  position: CargoPosition,
  orientation: CargoOrientation = 'XYZ',
): boolean {
  return isCargoPositionAvailable({
    cargoId: 'cargo-b',
    position,
    orientation,
    cargoSpace,
    placedCargo: createPlacedCargo(),
    cargoTemplates: [cargoTemplate],
  })
}

describe('isCargoPositionAvailable', () => {
  it('разрешает свободное положение внутри кузова', () => {
    expect(
      validateSecondCargoPosition({
        xMm: 2000,
        yMm: 0,
        zMm: 0,
      }),
    ).toBe(true)
  })

  it('разрешает касание грузов гранями', () => {
    expect(
      validateSecondCargoPosition({
        xMm: 1200,
        yMm: 0,
        zMm: 0,
      }),
    ).toBe(true)
  })

  it('запрещает пересечение грузов даже на 1 мм', () => {
    expect(
      validateSecondCargoPosition({
        xMm: 1199,
        yMm: 0,
        zMm: 0,
      }),
    ).toBe(false)
  })

  it('запрещает отрицательную координату X', () => {
    expect(
      validateSecondCargoPosition({
        xMm: -1,
        yMm: 0,
        zMm: 0,
      }),
    ).toBe(false)
  })

  it('запрещает выход за длину кузова', () => {
    expect(
      validateSecondCargoPosition({
        xMm: 12401,
        yMm: 0,
        zMm: 0,
      }),
    ).toBe(false)
  })

  it('запрещает выход за ширину кузова', () => {
    expect(
      validateSecondCargoPosition({
        xMm: 3000,
        yMm: 0,
        zMm: 1651,
      }),
    ).toBe(false)
  })

  it('учитывает размеры груза после поворота', () => {
    expect(
      validateSecondCargoPosition(
        {
          xMm: 12800,
          yMm: 0,
          zMm: 1250,
        },
        'ZYX',
      ),
    ).toBe(true)

    expect(
      validateSecondCargoPosition(
        {
          xMm: 12801,
          yMm: 0,
          zMm: 1250,
        },
        'ZYX',
      ),
    ).toBe(false)
  })

  it('запрещает груз выше кузова', () => {
    const tallTemplate: CargoTemplate = {
      ...cargoTemplate,
      id: 'template-tall',
      sku: 'TALL',
      heightMm: 2800,
    }

    const placedCargo: PlacedCargo[] = [
      {
        id: 'cargo-a',
        templateId: cargoTemplate.id,
        position: {
          xMm: 0,
          yMm: 0,
          zMm: 0,
        },
        orientation: 'XYZ',
        locked: false,
      },
      {
        id: 'cargo-b',
        templateId: tallTemplate.id,
        position: {
          xMm: 3000,
          yMm: 0,
          zMm: 0,
        },
        orientation: 'XYZ',
        locked: false,
      },
    ]

    expect(
      isCargoPositionAvailable({
        cargoId: 'cargo-b',
        position: {
          xMm: 3000,
          yMm: 0,
          zMm: 0,
        },
        cargoSpace,
        placedCargo,
        cargoTemplates: [
          cargoTemplate,
          tallTemplate,
        ],
      }),
    ).toBe(false)
  })
})