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
import { arrangeCargoOnFloor } from './autoPacking'

const cargoSpace: CargoSpace = {
  id: 'test-space',
  name: 'Тестовый кузов',
  type: 'truck',
  lengthMm: 3000,
  widthMm: 1000,
  heightMm: 2500,
  maxWeightKg: 10000,
}

const largeTemplate: CargoTemplate = {
  id: 'template-large',
  sku: 'LARGE',
  name: 'Большой груз',
  lengthMm: 1200,
  widthMm: 1000,
  heightMm: 600,
  weightKg: 200,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 500,
}

const smallTemplate: CargoTemplate = {
  id: 'template-small',
  sku: 'SMALL',
  name: 'Маленький груз',
  lengthMm: 800,
  widthMm: 1000,
  heightMm: 400,
  weightKg: 100,
  color: '#22c55e',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 200,
}

const cargoTemplates = [
  largeTemplate,
  smallTemplate,
]

function createCargo(
  id: string,
  templateId: string,
  xMm: number,
  options?: {
    yMm?: number
    zMm?: number
    locked?: boolean
  },
): PlacedCargo {
  return {
    id,
    templateId,
    position: {
      xMm,
      yMm: options?.yMm ?? 0,
      zMm: options?.zMm ?? 0,
    },
    orientation: 'XYZ',
    locked: options?.locked ?? false,
  }
}

describe('arrangeCargoOnFloor', () => {
  it('размещает крупный груз раньше маленького', () => {
    const smallCargo = createCargo(
      'cargo-small',
      smallTemplate.id,
      2000,
    )

    const largeCargo = createCargo(
      'cargo-large',
      largeTemplate.id,
      1000,
    )

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [
        smallCargo,
        largeCargo,
      ],
      cargoTemplates,
    })

    const arrangedLargeCargo =
      result.placedCargo.find(
        (cargo) => cargo.id === 'cargo-large',
      )

    const arrangedSmallCargo =
      result.placedCargo.find(
        (cargo) => cargo.id === 'cargo-small',
      )

    expect(
      arrangedLargeCargo?.position,
    ).toEqual({
      xMm: 0,
      yMm: 0,
      zMm: 0,
    })

    expect(
      arrangedSmallCargo?.position,
    ).toEqual({
      xMm: 1200,
      yMm: 0,
      zMm: 0,
    })

    expect(result.unplacedCargoIds).toEqual([])
  })

  it('не перемещает заблокированный груз', () => {
    const lockedCargo = createCargo(
      'cargo-locked',
      smallTemplate.id,
      1000,
      {
        locked: true,
      },
    )

    const movableCargo = createCargo(
      'cargo-movable',
      smallTemplate.id,
      2000,
    )

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [
        lockedCargo,
        movableCargo,
      ],
      cargoTemplates,
    })

    const arrangedLockedCargo =
      result.placedCargo.find(
        (cargo) => cargo.id === 'cargo-locked',
      )

    expect(
      arrangedLockedCargo?.position,
    ).toEqual({
      xMm: 1000,
      yMm: 0,
      zMm: 0,
    })

    expect(arrangedLockedCargo?.locked).toBe(true)
  })

  it('не разрушает существующий штабель', () => {
    const baseCargo = createCargo(
      'cargo-base',
      largeTemplate.id,
      0,
    )

    const upperCargo = createCargo(
      'cargo-upper',
      smallTemplate.id,
      200,
      {
        yMm: 600,
      },
    )

    const movableCargo = createCargo(
      'cargo-movable',
      smallTemplate.id,
      2000,
    )

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [
        baseCargo,
        upperCargo,
        movableCargo,
      ],
      cargoTemplates,
    })

    const arrangedBaseCargo =
      result.placedCargo.find(
        (cargo) => cargo.id === 'cargo-base',
      )

    const arrangedUpperCargo =
      result.placedCargo.find(
        (cargo) => cargo.id === 'cargo-upper',
      )

    expect(
      arrangedBaseCargo?.position,
    ).toEqual(baseCargo.position)

    expect(
      arrangedUpperCargo?.position,
    ).toEqual(upperCargo.position)
  })

  it('возвращает идентификатор груза, которому не хватило места', () => {
    const narrowCargoSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 1500,
    }

    const firstCargo = createCargo(
      'cargo-a',
      smallTemplate.id,
      0,
    )

    const secondCargo = createCargo(
      'cargo-b',
      smallTemplate.id,
      700,
    )

    const result = arrangeCargoOnFloor({
      cargoSpace: narrowCargoSpace,
      placedCargo: [
        firstCargo,
        secondCargo,
      ],
      cargoTemplates,
    })

    expect(result.unplacedCargoIds).toEqual([
      'cargo-b',
    ])

    const unplacedCargo =
      result.placedCargo.find(
        (cargo) => cargo.id === 'cargo-b',
      )

    expect(unplacedCargo?.position).toEqual(
      secondCargo.position,
    )
  })

  it('сохраняет исходный порядок грузов в результате', () => {
    const smallCargo = createCargo(
      'cargo-small',
      smallTemplate.id,
      2000,
    )

    const largeCargo = createCargo(
      'cargo-large',
      largeTemplate.id,
      1000,
    )

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [
        smallCargo,
        largeCargo,
      ],
      cargoTemplates,
    })

    expect(
      result.placedCargo.map((cargo) => cargo.id),
    ).toEqual([
      'cargo-small',
      'cargo-large',
    ])
  })

  it('помечает груз без шаблона как неразмещённый', () => {
    const cargoWithoutTemplate = createCargo(
      'cargo-unknown',
      'missing-template',
      500,
    )

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [cargoWithoutTemplate],
      cargoTemplates,
    })

    expect(result.unplacedCargoIds).toEqual([
      'cargo-unknown',
    ])

    expect(result.placedCargo[0].position).toEqual(
      cargoWithoutTemplate.position,
    )
  })
})