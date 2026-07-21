import {
  describe,
  expect,
  it,
} from 'vitest'
import type {
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import { findAvailableFloorPosition } from './placement'

const cargoSpace: CargoSpace = {
  id: 'test-space',
  name: 'Тестовый кузов',
  type: 'truck',
  lengthMm: 3000,
  widthMm: 800,
  heightMm: 2000,
  maxWeightKg: 10000,
}

const cargoTemplate: CargoTemplate = {
  id: 'template-standard',
  sku: 'STANDARD',
  name: 'Стандартный груз',
  lengthMm: 1000,
  widthMm: 800,
  heightMm: 500,
  weightKg: 100,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 200,
}

function createCargo(
  id: string,
  xMm: number,
): PlacedCargo {
  return {
    id,
    templateId: cargoTemplate.id,
    position: {
      xMm,
      yMm: 0,
      zMm: 0,
    },
    orientation: 'XYZ',
    locked: false,
  }
}

describe('findAvailableFloorPosition', () => {
  it('размещает первый груз в начале кузова', () => {
    const candidateCargo = createCargo(
      'cargo-candidate',
      0,
    )

    expect(
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace,
        placedCargo: [],
        cargoTemplates: [cargoTemplate],
      }),
    ).toEqual({
      xMm: 0,
      yMm: 0,
      zMm: 0,
    })
  })

  it('размещает следующий груз вплотную к существующему', () => {
    const candidateCargo = createCargo(
      'cargo-candidate',
      0,
    )

    expect(
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace,
        placedCargo: [
          createCargo('cargo-a', 0),
        ],
        cargoTemplates: [cargoTemplate],
      }),
    ).toEqual({
      xMm: 1000,
      yMm: 0,
      zMm: 0,
    })
  })

  it('выбирает ближайшую свободную позицию', () => {
    const candidateCargo = createCargo(
      'cargo-candidate',
      1800,
    )

    expect(
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace,
        placedCargo: [
          createCargo('cargo-a', 0),
        ],
        cargoTemplates: [cargoTemplate],
      }),
    ).toEqual({
      xMm: 2000,
      yMm: 0,
      zMm: 0,
    })
  })

  it('возвращает null при полностью занятом полу', () => {
    const candidateCargo = createCargo(
      'cargo-candidate',
      0,
    )

    expect(
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace,
        placedCargo: [
          createCargo('cargo-a', 0),
          createCargo('cargo-b', 1000),
          createCargo('cargo-c', 2000),
        ],
        cargoTemplates: [cargoTemplate],
      }),
    ).toBeNull()
  })

  it('возвращает null для груза больше кузова', () => {
    const oversizedTemplate: CargoTemplate = {
      ...cargoTemplate,
      id: 'template-oversized',
      lengthMm: 3100,
    }

    const candidateCargo: PlacedCargo = {
      ...createCargo('cargo-candidate', 0),
      templateId: oversizedTemplate.id,
    }

    expect(
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace,
        placedCargo: [],
        cargoTemplates: [
          cargoTemplate,
          oversizedTemplate,
        ],
      }),
    ).toBeNull()
  })

  it('учитывает ориентацию при поиске позиции', () => {
    const rotatedSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 800,
      widthMm: 1000,
    }

    const candidateCargo: PlacedCargo = {
      ...createCargo('cargo-candidate', 0),
      orientation: 'ZYX',
    }

    expect(
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace: rotatedSpace,
        placedCargo: [],
        cargoTemplates: [cargoTemplate],
      }),
    ).toEqual({
      xMm: 0,
      yMm: 0,
      zMm: 0,
    })
  })
})
