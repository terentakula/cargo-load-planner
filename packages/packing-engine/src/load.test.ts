import {
  describe,
  expect,
  it,
} from 'vitest'
import type {
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import {
  getCargoTopLoadKg,
  isCargoStackValid,
} from './load'

const baseTemplate: CargoTemplate = {
  id: 'template-base',
  sku: 'BASE',
  name: 'Основание',
  lengthMm: 1200,
  widthMm: 800,
  heightMm: 600,
  weightKg: 100,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 200,
}

const middleTemplate: CargoTemplate = {
  id: 'template-middle',
  sku: 'MIDDLE',
  name: 'Средний груз',
  lengthMm: 1000,
  widthMm: 600,
  heightMm: 500,
  weightKg: 120,
  color: '#22c55e',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 80,
}

const topTemplate: CargoTemplate = {
  id: 'template-top',
  sku: 'TOP',
  name: 'Верхний груз',
  lengthMm: 800,
  widthMm: 400,
  heightMm: 300,
  weightKg: 80,
  color: '#8b5cf6',
  canBeTilted: true,
  stackable: false,
  maxTopLoadKg: null,
}

const cargoTemplates: CargoTemplate[] = [
  baseTemplate,
  middleTemplate,
  topTemplate,
]

function createValidStack(): PlacedCargo[] {
  return [
    {
      id: 'cargo-base',
      templateId: baseTemplate.id,
      position: {
        xMm: 0,
        yMm: 0,
        zMm: 0,
      },
      orientation: 'XYZ',
      locked: false,
    },
    {
      id: 'cargo-middle',
      templateId: middleTemplate.id,
      position: {
        xMm: 100,
        yMm: 600,
        zMm: 100,
      },
      orientation: 'XYZ',
      locked: false,
    },
    {
      id: 'cargo-top',
      templateId: topTemplate.id,
      position: {
        xMm: 200,
        yMm: 1100,
        zMm: 200,
      },
      orientation: 'XYZ',
      locked: false,
    },
  ]
}

describe('isCargoStackValid', () => {
  it('разрешает штабель с полной опорой', () => {
    const placedCargo = createValidStack()

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: placedCargo[2].position,
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(true)
  })

  it('разрешает нагрузку, равную предельной', () => {
    const placedCargo = createValidStack()

    expect(
      isCargoStackValid({
        cargoId: 'cargo-middle',
        position: placedCargo[1].position,
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(true)
  })

  it('запрещает частичную опору', () => {
    const placedCargo = createValidStack()

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: {
          xMm: 400,
          yMm: 1100,
          zMm: 200,
        },
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(false)
  })

  it('запрещает установку на нештабелируемый груз', () => {
    const placedCargo = createValidStack()

    const nonStackableMiddle: CargoTemplate = {
      ...middleTemplate,
      stackable: false,
      maxTopLoadKg: null,
    }

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: placedCargo[2].position,
        placedCargo,
        cargoTemplates: [
          baseTemplate,
          nonStackableMiddle,
          topTemplate,
        ],
      }),
    ).toBe(false)
  })

  it('учитывает суммарный вес всего верхнего поддерева', () => {
    const placedCargo = createValidStack()

    const weakBase: CargoTemplate = {
      ...baseTemplate,
      maxTopLoadKg: 199,
    }

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: placedCargo[2].position,
        placedCargo,
        cargoTemplates: [
          weakBase,
          middleTemplate,
          topTemplate,
        ],
      }),
    ).toBe(false)
  })

  it('проверяет ограничение каждого уровня штабеля', () => {
    const placedCargo = createValidStack()

    const weakMiddle: CargoTemplate = {
      ...middleTemplate,
      maxTopLoadKg: 79,
    }

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: placedCargo[2].position,
        placedCargo,
        cargoTemplates: [
          baseTemplate,
          weakMiddle,
          topTemplate,
        ],
      }),
    ).toBe(false)
  })

  it('запрещает груз без опоры над полом', () => {
    const placedCargo = createValidStack()

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: {
          xMm: 200,
          yMm: 1200,
          zMm: 200,
        },
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(false)
  })

  it('разрешает неограниченную нагрузку при null', () => {
    const placedCargo = createValidStack()

    const unlimitedBase: CargoTemplate = {
      ...baseTemplate,
      maxTopLoadKg: null,
    }

    expect(
      isCargoStackValid({
        cargoId: 'cargo-top',
        position: placedCargo[2].position,
        placedCargo,
        cargoTemplates: [
          unlimitedBase,
          middleTemplate,
          topTemplate,
        ],
      }),
    ).toBe(true)
  })
})

describe('getCargoTopLoadKg', () => {
  it('считает вес всего штабеля над основанием', () => {
    expect(
      getCargoTopLoadKg({
        cargoId: 'cargo-base',
        placedCargo: createValidStack(),
        cargoTemplates,
      }),
    ).toBe(200)
  })

  it('считает только груз над средним уровнем', () => {
    expect(
      getCargoTopLoadKg({
        cargoId: 'cargo-middle',
        placedCargo: createValidStack(),
        cargoTemplates,
      }),
    ).toBe(80)
  })

  it('возвращает ноль для верхнего груза', () => {
    expect(
      getCargoTopLoadKg({
        cargoId: 'cargo-top',
        placedCargo: createValidStack(),
        cargoTemplates,
      }),
    ).toBe(0)
  })
})