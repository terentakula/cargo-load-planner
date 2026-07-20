import type {
  CargoPosition,
  CargoTemplate,
  PlacedCargo,
} from '../model/types'

export type CargoBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

type PositionValidationInput = {
  cargoId: string
  position: CargoPosition
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

export function getCargoBounds(
  cargoTemplate: CargoTemplate,
  placedCargo: PlacedCargo,
): CargoBounds {
  return {
    minX: placedCargo.position.xMm,
    maxX:
      placedCargo.position.xMm +
      cargoTemplate.lengthMm,

    minY: placedCargo.position.yMm,
    maxY:
      placedCargo.position.yMm +
      cargoTemplate.heightMm,

    minZ: placedCargo.position.zMm,
    maxZ:
      placedCargo.position.zMm +
      cargoTemplate.widthMm,
  }
}

export function cargoBoundsIntersect(
  first: CargoBounds,
  second: CargoBounds,
): boolean {
  return (
    first.minX < second.maxX &&
    first.maxX > second.minX &&
    first.minY < second.maxY &&
    first.maxY > second.minY &&
    first.minZ < second.maxZ &&
    first.maxZ > second.minZ
  )
}

export function isCargoPositionAvailable({
  cargoId,
  position,
  placedCargo,
  cargoTemplates,
}: PositionValidationInput): boolean {
  const movingCargo = placedCargo.find(
    (cargo) => cargo.id === cargoId,
  )

  if (!movingCargo) {
    return false
  }

  const movingTemplate = cargoTemplates.find(
    (template) =>
      template.id === movingCargo.templateId,
  )

  if (!movingTemplate) {
    return false
  }

  const candidateCargo: PlacedCargo = {
    ...movingCargo,
    position,
  }

  const candidateBounds = getCargoBounds(
    movingTemplate,
    candidateCargo,
  )

  return placedCargo.every((otherCargo) => {
    if (otherCargo.id === cargoId) {
      return true
    }

    const otherTemplate = cargoTemplates.find(
      (template) =>
        template.id === otherCargo.templateId,
    )

    if (!otherTemplate) {
      return true
    }

    const otherBounds = getCargoBounds(
      otherTemplate,
      otherCargo,
    )

    return !cargoBoundsIntersect(
      candidateBounds,
      otherBounds,
    )
  })
}