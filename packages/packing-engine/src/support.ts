import type {
  CargoPosition,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import { getOrientedCargoSize } from './orientation'

type SupportedCargoPositionInput = {
  cargoId: string
  position: CargoPosition
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

type CargoSupportCheckInput = {
  cargoId: string
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

export function getSupportedCargoPosition({
  cargoId,
  position,
  placedCargo,
  cargoTemplates,
}: SupportedCargoPositionInput): CargoPosition {
  const movingCargo = placedCargo.find(
    (cargo) => cargo.id === cargoId,
  )

  if (!movingCargo) {
    return position
  }

  const movingTemplate = cargoTemplates.find(
    (template) =>
      template.id === movingCargo.templateId,
  )

  if (!movingTemplate) {
    return position
  }

  const movingSize = getOrientedCargoSize(
    movingTemplate,
    movingCargo.orientation,
  )

  let supportedY = 0

  placedCargo.forEach((otherCargo) => {
    if (otherCargo.id === cargoId) {
      return
    }

    const otherTemplate = cargoTemplates.find(
      (template) =>
        template.id === otherCargo.templateId,
    )

    if (
      !otherTemplate ||
      !otherTemplate.stackable
    ) {
      return
    }

    const otherSize = getOrientedCargoSize(
      otherTemplate,
      otherCargo.orientation,
    )

    const fitsByX =
      position.xMm >= otherCargo.position.xMm &&
      position.xMm + movingSize.xMm <=
        otherCargo.position.xMm + otherSize.xMm

    const fitsByZ =
      position.zMm >= otherCargo.position.zMm &&
      position.zMm + movingSize.zMm <=
        otherCargo.position.zMm + otherSize.zMm

    if (!fitsByX || !fitsByZ) {
      return
    }

    const otherTopY =
      otherCargo.position.yMm + otherSize.yMm

    supportedY = Math.max(
      supportedY,
      otherTopY,
    )
  })

  return {
    ...position,
    yMm: supportedY,
  }
}

export function isCargoSupportingAnotherCargo({
  cargoId,
  placedCargo,
  cargoTemplates,
}: CargoSupportCheckInput): boolean {
  const supportingCargo = placedCargo.find(
    (cargo) => cargo.id === cargoId,
  )

  if (!supportingCargo) {
    return false
  }

  const supportingTemplate = cargoTemplates.find(
    (template) =>
      template.id === supportingCargo.templateId,
  )

  if (!supportingTemplate) {
    return false
  }

  const supportingSize = getOrientedCargoSize(
    supportingTemplate,
    supportingCargo.orientation,
  )

  const supportingTopY =
    supportingCargo.position.yMm +
    supportingSize.yMm

  return placedCargo.some((otherCargo) => {
    if (
      otherCargo.id === cargoId ||
      otherCargo.position.yMm !== supportingTopY
    ) {
      return false
    }

    const otherTemplate = cargoTemplates.find(
      (template) =>
        template.id === otherCargo.templateId,
    )

    if (!otherTemplate) {
      return false
    }

    const otherSize = getOrientedCargoSize(
      otherTemplate,
      otherCargo.orientation,
    )

    const supportedByX =
      otherCargo.position.xMm >=
        supportingCargo.position.xMm &&
      otherCargo.position.xMm + otherSize.xMm <=
        supportingCargo.position.xMm +
          supportingSize.xMm

    const supportedByZ =
      otherCargo.position.zMm >=
        supportingCargo.position.zMm &&
      otherCargo.position.zMm + otherSize.zMm <=
        supportingCargo.position.zMm +
          supportingSize.zMm

    return supportedByX && supportedByZ
  })
}