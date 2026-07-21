import {
  describe,
  expect,
  it,
} from 'vitest'
import type {
  CargoOrientation,
  CargoPosition,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import {
  getSupportedCargoPosition,
  isCargoSupportingAnotherCargo,
} from './support'

const baseTemplate: CargoTemplate = {
  id: 'template-base',
  sku: 'BASE',
  name: 'Груз-основание',
  lengthMm: 1200,
  widthMm: 800,
  heightMm: 600,
  weightKg: 150,
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 500,
}

const upperTemplate: CargoTemplate = {
  id: 'template-upper',
  sku: 'UPPER',
  name: 'Верхний груз',
  lengthMm: 800,
  widthMm: 600,
  heightMm: 400,
  weightKg: 80,
  color: '#22c55e',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 200,
}

const cargoTemplates = [
  baseTemplate,
  upperTemplate,
]

function createCargo(
  id: string,
  templateId: string,
  position: CargoPosition,
  orientation: CargoOrientation = 'XYZ',
): PlacedCargo {
  return {
    id,
    templateId,
    position,
    orientation,
    locked: false,
  }
}

function createBaseCargo(
  position: CargoPosition = {
    xMm: 0,
    yMm: 0,
    zMm: 0,
  },
): PlacedCargo {
  return createCargo(
    'cargo-base',
    baseTemplate.id,
    position,
  )
}

function createUpperCargo(
  position: CargoPosition = {
    xMm: 2000,
    yMm: 0,
    zMm: 0,
  },
  orientation: CargoOrientation = 'XYZ',
): PlacedCargo {
  return createCargo(
    'cargo-upper',
    upperTemplate.id,
    position,
    orientation,
  )
}

describe('getSupportedCargoPosition', () => {
  it('устанавливает груз на полностью подходящую опору', () => {
    const placedCargo = [
      createBaseCargo(),
      createUpperCargo(),
    ]

    expect(
      getSupportedCargoPosition({
        cargoId: 'cargo-upper',
        position: {
          xMm: 100,
          yMm: 0,
          zMm: 100,
        },
        placedCargo,
        cargoTemplates,
      }),
    ).toEqual({
      xMm: 100,
      yMm: 600,
      zMm: 100,
    })
  })

  it('не устанавливает груз при частичной опоре', () => {
    const placedCargo = [
      createBaseCargo(),
      createUpperCargo(),
    ]

    expect(
      getSupportedCargoPosition({
        cargoId: 'cargo-upper',
        position: {
          xMm: 500,
          yMm: 0,
          zMm: 100,
        },
        placedCargo,
        cargoTemplates,
      }),
    ).toEqual({
      xMm: 500,
      yMm: 0,
      zMm: 100,
    })
  })

  it('не использует нештабелируемый груз как опору', () => {
    const nonStackableBase: CargoTemplate = {
      ...baseTemplate,
      stackable: false,
      maxTopLoadKg: null,
    }

    const placedCargo = [
      createBaseCargo(),
      createUpperCargo(),
    ]

    expect(
      getSupportedCargoPosition({
        cargoId: 'cargo-upper',
        position: {
          xMm: 100,
          yMm: 0,
          zMm: 100,
        },
        placedCargo,
        cargoTemplates: [
          nonStackableBase,
          upperTemplate,
        ],
      }),
    ).toEqual({
      xMm: 100,
      yMm: 0,
      zMm: 100,
    })
  })

  it('выбирает самую высокую подходящую опору', () => {
    const lowerSupport = createCargo(
      'cargo-lower-support',
      baseTemplate.id,
      {
        xMm: 0,
        yMm: 0,
        zMm: 0,
      },
    )

    const higherSupport = createCargo(
      'cargo-higher-support',
      baseTemplate.id,
      {
        xMm: 0,
        yMm: 600,
        zMm: 0,
      },
    )

    const placedCargo = [
      lowerSupport,
      higherSupport,
      createUpperCargo(),
    ]

    expect(
      getSupportedCargoPosition({
        cargoId: 'cargo-upper',
        position: {
          xMm: 100,
          yMm: 0,
          zMm: 100,
        },
        placedCargo,
        cargoTemplates,
      }),
    ).toEqual({
      xMm: 100,
      yMm: 1200,
      zMm: 100,
    })
  })

  it('учитывает ориентацию верхнего груза', () => {
    const placedCargo = [
      createBaseCargo(),
      createUpperCargo(
        {
          xMm: 2000,
          yMm: 0,
          zMm: 0,
        },
        'ZYX',
      ),
    ]

    expect(
      getSupportedCargoPosition({
        cargoId: 'cargo-upper',
        position: {
          xMm: 600,
          yMm: 0,
          zMm: 0,
        },
        placedCargo,
        cargoTemplates,
      }),
    ).toEqual({
      xMm: 600,
      yMm: 600,
      zMm: 0,
    })
  })
})

describe('isCargoSupportingAnotherCargo', () => {
  it('определяет груз, который служит опорой', () => {
    const placedCargo = [
      createBaseCargo(),
      createUpperCargo({
        xMm: 100,
        yMm: 600,
        zMm: 100,
      }),
    ]

    expect(
      isCargoSupportingAnotherCargo({
        cargoId: 'cargo-base',
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(true)
  })

  it('не считает частично выступающий груз поддерживаемым', () => {
    const placedCargo = [
      createBaseCargo(),
      createUpperCargo({
        xMm: 500,
        yMm: 600,
        zMm: 100,
      }),
    ]

    expect(
      isCargoSupportingAnotherCargo({
        cargoId: 'cargo-base',
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(false)
  })

  it('не считает груз поддерживаемым при зазоре по высоте', () => {
    const placedCargo = [
      createBaseCargo(),
      createUpperCargo({
        xMm: 100,
        yMm: 601,
        zMm: 100,
      }),
    ]

    expect(
      isCargoSupportingAnotherCargo({
        cargoId: 'cargo-base',
        placedCargo,
        cargoTemplates,
      }),
    ).toBe(false)
  })
})