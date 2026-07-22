import type {
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import { getOrientedCargoSize } from './orientation'
import { findAvailableFloorPosition } from './placement'
import { isCargoSupportingAnotherCargo } from './support'

export type ArrangeCargoOnFloorInput = {
  cargoSpace: CargoSpace
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

export type ArrangeCargoOnFloorResult = {
  placedCargo: PlacedCargo[]
  unplacedCargoIds: string[]
}

function getCargoFootprintArea(
  cargo: PlacedCargo,
  cargoTemplatesById: Map<string, CargoTemplate>,
): number {
  const cargoTemplate = cargoTemplatesById.get(
    cargo.templateId,
  )

  if (!cargoTemplate) {
    return -1
  }

  const cargoSize = getOrientedCargoSize(
    cargoTemplate,
    cargo.orientation,
  )

  return cargoSize.xMm * cargoSize.zMm
}

export function arrangeCargoOnFloor({
  cargoSpace,
  placedCargo,
  cargoTemplates,
}: ArrangeCargoOnFloorInput): ArrangeCargoOnFloorResult {
  const cargoTemplatesById = new Map(
    cargoTemplates.map((cargoTemplate) => [
      cargoTemplate.id,
      cargoTemplate,
    ]),
  )

  const fixedCargoIds = new Set<string>()

  placedCargo.forEach((cargo) => {
    const isPartOfStack =
      cargo.position.yMm > 0 ||
      isCargoSupportingAnotherCargo({
        cargoId: cargo.id,
        placedCargo,
        cargoTemplates,
      })

    if (cargo.locked || isPartOfStack) {
      fixedCargoIds.add(cargo.id)
    }
  })

  const fixedCargo = placedCargo.filter((cargo) =>
    fixedCargoIds.has(cargo.id),
  )

  const cargoToArrange = placedCargo
    .filter((cargo) => !fixedCargoIds.has(cargo.id))
    .sort((firstCargo, secondCargo) => {
      const firstArea = getCargoFootprintArea(
        firstCargo,
        cargoTemplatesById,
      )

      const secondArea = getCargoFootprintArea(
        secondCargo,
        cargoTemplatesById,
      )

      if (firstArea !== secondArea) {
        return secondArea - firstArea
      }

      return firstCargo.id.localeCompare(
        secondCargo.id,
      )
    })

  const arrangedCargo = [...fixedCargo]
  const unplacedCargoIds: string[] = []

  cargoToArrange.forEach((cargo) => {
    const cargoTemplate = cargoTemplatesById.get(
      cargo.templateId,
    )

    if (!cargoTemplate) {
      unplacedCargoIds.push(cargo.id)
      return
    }

    const candidateCargo: PlacedCargo = {
      ...cargo,
      position: {
        xMm: 0,
        yMm: 0,
        zMm: 0,
      },
    }

    const availablePosition =
      findAvailableFloorPosition({
        candidateCargo,
        cargoSpace,
        placedCargo: arrangedCargo,
        cargoTemplates,
      })

    if (!availablePosition) {
      unplacedCargoIds.push(cargo.id)
      return
    }

    arrangedCargo.push({
      ...candidateCargo,
      position: availablePosition,
    })
  })

  const arrangedCargoById = new Map(
    arrangedCargo.map((cargo) => [
      cargo.id,
      cargo,
    ]),
  )

  return {
    placedCargo: placedCargo.map(
      (cargo) =>
        arrangedCargoById.get(cargo.id) ?? cargo,
    ),
    unplacedCargoIds,
  }
}