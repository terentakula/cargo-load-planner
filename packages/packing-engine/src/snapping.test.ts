import {
  describe,
  expect,
  it,
} from 'vitest'
import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import { getSnappedCargoPosition } from './snapping'

const cargoSpace: CargoSpace = {
  id: 'test-space',
  name: 'Тестовый кузов',
  type: 'truck',
  lengthMm: 5000,
  widthMm: 3000,
  heightMm: 2500,
  maxWeightKg: 10000,
}

const cargoTemplate: CargoTemplate = {
  id: 'template-standard',
  sku: 'STANDARD',
  name: 'Стандартный груз',
  lengthMm: 1000,
  widthMm: 800,
  heightMm: 600,
  weightKg: 100,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 200,
}

function createMovingCargo(): PlacedCargo {
  return {
    id: 'cargo-moving',
    templateId: cargoTemplate.id,
    position: {
      xMm: 2500,
      yMm: 0,
      zMm: 1500,
    },
    orientation: 'XYZ',
    locked: false,
  }
}

function getSnappedPosition(
  position: CargoPosition,
  otherCargo: PlacedCargo[] = [],
): CargoPosition {
  return getSnappedCargoPosition({
    cargoId: 'cargo-moving',
    position,
    cargoSpace,
    placedCargo: [
      createMovingCargo(),
      ...otherCargo,
    ],
    cargoTemplates: [cargoTemplate],
  })
}

describe('getSnappedCargoPosition', () => {
  it('притягивает груз к начальной стенке по X', () => {
    expect(
      getSnappedPosition({
        xMm: 70,
        yMm: 0,
        zMm: 1500,
      }),
    ).toEqual({
      xMm: 0,
      yMm: 0,
      zMm: 1500,
    })
  })

  it('притягивает груз к противоположной стенке по Z', () => {
    expect(
      getSnappedPosition({
        xMm: 2000,
        yMm: 0,
        zMm: 2140,
      }),
    ).toEqual({
      xMm: 2000,
      yMm: 0,
      zMm: 2200,
    })
  })

  it('притягивает груз к соседнему грузу по X', () => {
    const otherCargo: PlacedCargo = {
      id: 'cargo-other',
      templateId: cargoTemplate.id,
      position: {
        xMm: 1000,
        yMm: 0,
        zMm: 500,
      },
      orientation: 'XYZ',
      locked: false,
    }

    expect(
      getSnappedPosition(
        {
          xMm: 2050,
          yMm: 0,
          zMm: 500,
        },
        [otherCargo],
      ),
    ).toEqual({
      xMm: 2000,
      yMm: 0,
      zMm: 500,
    })
  })

  it('притягивает груз к соседнему грузу по Z', () => {
    const otherCargo: PlacedCargo = {
      id: 'cargo-other',
      templateId: cargoTemplate.id,
      position: {
        xMm: 500,
        yMm: 0,
        zMm: 1000,
      },
      orientation: 'XYZ',
      locked: false,
    }

    expect(
      getSnappedPosition(
        {
          xMm: 500,
          yMm: 0,
          zMm: 1850,
        },
        [otherCargo],
      ),
    ).toEqual({
      xMm: 500,
      yMm: 0,
      zMm: 1800,
    })
  })

  it('не притягивает позицию за пределами порога', () => {
    expect(
      getSnappedPosition({
        xMm: 101,
        yMm: 0,
        zMm: 1500,
      }),
    ).toEqual({
      xMm: 101,
      yMm: 0,
      zMm: 1500,
    })
  })

  it('учитывает ориентированные размеры груза', () => {
    const rotatedCargo: PlacedCargo = {
      ...createMovingCargo(),
      orientation: 'ZYX',
    }

    expect(
      getSnappedCargoPosition({
        cargoId: rotatedCargo.id,
        position: {
          xMm: 4140,
          yMm: 0,
          zMm: 1000,
        },
        cargoSpace,
        placedCargo: [rotatedCargo],
        cargoTemplates: [cargoTemplate],
      }),
    ).toEqual({
      xMm: 4200,
      yMm: 0,
      zMm: 1000,
    })
  })
})