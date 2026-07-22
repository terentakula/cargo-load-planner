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

export function findAvailableFloorPositions({
  candidateCargo,
  cargoSpace,
  placedCargo,
  cargoTemplates,
}: FindAvailableFloorPositionInput): CargoPosition[] {
  const candidateTemplate = cargoTemplates.find(
    (template) =>
      template.id === candidateCargo.templateId,
  )

  if (!candidateTemplate) {
    return []
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
    return []
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

  return positions.filter((position) => {
  const placedCargoWithCandidate = [
    ...placedCargo,
    {
      ...candidateCargo,
      position,
    },
  ]

  return isCargoPositionAvailable({
    cargoId: candidateCargo.id,
    position,
    cargoSpace,
    placedCargo: placedCargoWithCandidate,
    cargoTemplates,
  })
})
}


export function findAvailableFloorPosition(
  input: FindAvailableFloorPositionInput,
): CargoPosition | null {
  return findAvailableFloorPositions(input)[0] ?? null
}

export function findAvailableCargoPositions(
  input: FindAvailableFloorPositionInput,
): CargoPosition[] {
  const {
    candidateCargo,
    cargoSpace,
    placedCargo,
    cargoTemplates,
  } = input

  const floorPositions =
    findAvailableFloorPositions(input)

  const candidateTemplate = cargoTemplates.find(
    (template) =>
      template.id === candidateCargo.templateId,
  )

  if (!candidateTemplate) {
    return floorPositions
  }

  const candidateSize = getOrientedCargoSize(
    candidateTemplate,
    candidateCargo.orientation,
  )

  const positionKeys = new Set(
    floorPositions.map(
      (position) =>
        `${position.xMm}:${position.yMm}:${position.zMm}`,
    ),
  )

  const stackPositions: CargoPosition[] = []

  placedCargo.forEach((supportCargo) => {
    const supportTemplate = cargoTemplates.find(
      (template) =>
        template.id === supportCargo.templateId,
    )

    if (
      !supportTemplate ||
      !supportTemplate.stackable
    ) {
      return
    }

    const supportSize = getOrientedCargoSize(
      supportTemplate,
      supportCargo.orientation,
    )

    const supportTopY =
      supportCargo.position.yMm +
      supportSize.yMm

    if (
      supportTopY + candidateSize.yMm >
      cargoSpace.heightMm
    ) {
      return
    }

    const minimumX = supportCargo.position.xMm

    const maximumX =
      supportCargo.position.xMm +
      supportSize.xMm -
      candidateSize.xMm

    const minimumZ = supportCargo.position.zMm

    const maximumZ =
      supportCargo.position.zMm +
      supportSize.zMm -
      candidateSize.zMm

    if (
      maximumX < minimumX ||
      maximumZ < minimumZ
    ) {
      return
    }

    const xCandidates = new Set<number>([
      minimumX,
      maximumX,
    ])

    const zCandidates = new Set<number>([
      minimumZ,
      maximumZ,
    ])

    placedCargo.forEach((otherCargo) => {
      const otherTemplate = cargoTemplates.find(
        (template) =>
          template.id === otherCargo.templateId,
      )

      if (!otherTemplate) {
        return
      }

      const otherSize = getOrientedCargoSize(
        otherTemplate,
        otherCargo.orientation,
      )

      const candidateTopY =
        supportTopY + candidateSize.yMm

      const otherBottomY =
        otherCargo.position.yMm

      const otherTopY =
        otherCargo.position.yMm +
        otherSize.yMm

      const overlapsByY =
        supportTopY < otherTopY &&
        candidateTopY > otherBottomY

      if (!overlapsByY) {
        return
      }

      xCandidates.add(
        clamp(
          otherCargo.position.xMm,
          minimumX,
          maximumX,
        ),
      )

      xCandidates.add(
        clamp(
          otherCargo.position.xMm +
            otherSize.xMm,
          minimumX,
          maximumX,
        ),
      )

      xCandidates.add(
        clamp(
          otherCargo.position.xMm -
            candidateSize.xMm,
          minimumX,
          maximumX,
        ),
      )

      zCandidates.add(
        clamp(
          otherCargo.position.zMm,
          minimumZ,
          maximumZ,
        ),
      )

      zCandidates.add(
        clamp(
          otherCargo.position.zMm +
            otherSize.zMm,
          minimumZ,
          maximumZ,
        ),
      )

      zCandidates.add(
        clamp(
          otherCargo.position.zMm -
            candidateSize.zMm,
          minimumZ,
          maximumZ,
        ),
      )
    })

    xCandidates.forEach((xMm) => {
      zCandidates.forEach((zMm) => {
        const position: CargoPosition = {
          xMm,
          yMm: supportTopY,
          zMm,
        }

        const positionKey =
          `${position.xMm}:${position.yMm}:${position.zMm}`

        if (positionKeys.has(positionKey)) {
          return
        }

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
            placedCargo:
              placedCargoWithCandidate,
            cargoTemplates,
          })

        if (!positionAvailable) {
          return
        }

        positionKeys.add(positionKey)
        stackPositions.push(position)
      })
    })
  })

  stackPositions.sort((first, second) => {
    if (first.yMm !== second.yMm) {
      return first.yMm - second.yMm
    }

    if (first.xMm !== second.xMm) {
      return first.xMm - second.xMm
    }

    return first.zMm - second.zMm
  })

  return [
    ...floorPositions,
    ...stackPositions,
  ]
}