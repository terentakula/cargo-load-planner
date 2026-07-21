import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import { isCargoPositionAvailable } from './collision'
import { getOrientedCargoSize } from './orientation'

export type FindAvailableFloorPositionInput = {
  candidateCargo: PlacedCargo
  cargoSpace: CargoSpace
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum)
}

export function findAvailableFloorPosition({
  candidateCargo,
  cargoSpace,
  placedCargo,
  cargoTemplates,
}: FindAvailableFloorPositionInput): CargoPosition | null {
  const candidateTemplate = cargoTemplates.find(
    (template) =>
      template.id === candidateCargo.templateId,
  )

  if (!candidateTemplate) {
    return null
  }

  const candidateSize = getOrientedCargoSize(
    candidateTemplate,
    candidateCargo.orientation,
  )

  const maximumX =
    cargoSpace.lengthMm - candidateSize.xMm

  const maximumZ =
    cargoSpace.widthMm - candidateSize.zMm

  if (
    maximumX < 0 ||
    maximumZ < 0 ||
    candidateSize.yMm > cargoSpace.heightMm
  ) {
    return null
  }

  const xCandidates = new Set<number>([
    0,
    maximumX,
  ])

  const zCandidates = new Set<number>([
    0,
    maximumZ,
  ])

  placedCargo.forEach((cargo) => {
    const template = cargoTemplates.find(
      (item) => item.id === cargo.templateId,
    )

    if (!template) {
      return
    }

    const size = getOrientedCargoSize(
      template,
      cargo.orientation,
    )

    xCandidates.add(
      clamp(cargo.position.xMm, 0, maximumX),
    )

    xCandidates.add(
      clamp(
        cargo.position.xMm + size.xMm,
        0,
        maximumX,
      ),
    )

    xCandidates.add(
      clamp(
        cargo.position.xMm - candidateSize.xMm,
        0,
        maximumX,
      ),
    )

    zCandidates.add(
      clamp(cargo.position.zMm, 0, maximumZ),
    )

    zCandidates.add(
      clamp(
        cargo.position.zMm + size.zMm,
        0,
        maximumZ,
      ),
    )

    zCandidates.add(
      clamp(
        cargo.position.zMm - candidateSize.zMm,
        0,
        maximumZ,
      ),
    )
  })

  const positions: CargoPosition[] = []

  xCandidates.forEach((xMm) => {
    zCandidates.forEach((zMm) => {
      positions.push({
        xMm,
        yMm: 0,
        zMm,
      })
    })
  })

  positions.sort((first, second) => {
    const firstDistance =
      Math.abs(
        first.xMm - candidateCargo.position.xMm,
      ) +
      Math.abs(
        first.zMm - candidateCargo.position.zMm,
      )

    const secondDistance =
      Math.abs(
        second.xMm - candidateCargo.position.xMm,
      ) +
      Math.abs(
        second.zMm - candidateCargo.position.zMm,
      )

    return firstDistance - secondDistance
  })

  for (const position of positions) {
    const placedCargoWithCandidate = [
      ...placedCargo,
      {
        ...candidateCargo,
        position,
      },
    ]

    const positionAvailable =
      isCargoPositionAvailable({
        cargoId: candidateCargo.id,
        position,
        cargoSpace,
        placedCargo: placedCargoWithCandidate,
        cargoTemplates,
      })

    if (positionAvailable) {
      return position
    }
  }

  return null
}
