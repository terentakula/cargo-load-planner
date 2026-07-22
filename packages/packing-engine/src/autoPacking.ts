import type {
  CargoOrientation,
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from './model/types'
import {
  getOrientedCargoSize,
  getRotatedCargoOrientation,
  type OrientedCargoSize,
} from './orientation'
import {
  findAvailableCargoPositions,
} from './placement'
import { isCargoSupportingAnotherCargo } from './support'
import { findAvailableWaitingZonePosition } from './waitingZone'

export type ArrangeCargoOnFloorInput = {
  cargoSpace: CargoSpace
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

export type ArrangeCargoOnFloorResult = {
  placedCargo: PlacedCargo[]
  unplacedCargoIds: string[]
}

type ArrangementSearchResult = {
  arrangedCargo: PlacedCargo[]
  unplacedCargoIds: string[]
}

type ArrangementSearchState = {
  visitedNodes: number
}

const MAX_SEARCH_NODES = 50_000
const MAX_POSITIONS_PER_ORIENTATION = 64

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

function getHorizontalOrientationCandidates(
  cargo: PlacedCargo,
): CargoOrientation[] {
  return Array.from(
    new Set<CargoOrientation>([
      cargo.orientation,
      getRotatedCargoOrientation(
        cargo.orientation,
        'y',
      ),
    ]),
  )
}

type ArrangementBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

function extendBounds(
  bounds: ArrangementBounds | null,
  position: CargoPosition,
  size: OrientedCargoSize,
): ArrangementBounds {
  const minX = position.xMm
  const maxX = minX + size.xMm
  const minY = position.yMm
  const maxY = minY + size.yMm
  const minZ = position.zMm
  const maxZ = minZ + size.zMm

  if (!bounds) {
    return { minX, maxX, minY, maxY, minZ, maxZ }
  }

  return {
    minX: Math.min(bounds.minX, minX),
    maxX: Math.max(bounds.maxX, maxX),
    minY: Math.min(bounds.minY, minY),
    maxY: Math.max(bounds.maxY, maxY),
    minZ: Math.min(bounds.minZ, minZ),
    maxZ: Math.max(bounds.maxZ, maxZ),
  }
}

function getArrangementBounds(
  cargoList: PlacedCargo[],
  cargoTemplatesById: Map<string, CargoTemplate>,
): ArrangementBounds | null {
  let bounds: ArrangementBounds | null = null

  cargoList.forEach((cargo) => {
    const cargoTemplate = cargoTemplatesById.get(
      cargo.templateId,
    )

    if (!cargoTemplate) {
      return
    }

    const size = getOrientedCargoSize(
      cargoTemplate,
      cargo.orientation,
    )

    bounds = extendBounds(
      bounds,
      cargo.position,
      size,
    )
  })

  return bounds
}

function getBoundsVolume(
  bounds: ArrangementBounds | null,
): number {
  if (!bounds) {
    return 0
  }

  return (
    (bounds.maxX - bounds.minX) *
    (bounds.maxY - bounds.minY) *
    (bounds.maxZ - bounds.minZ)
  )
}

function isBetterSearchResult(
  candidate: ArrangementSearchResult,
  currentBest: ArrangementSearchResult | null,
  cargoTemplatesById: Map<string, CargoTemplate>,
): boolean {
  if (!currentBest) {
    return true
  }

  if (
    candidate.unplacedCargoIds.length !==
    currentBest.unplacedCargoIds.length
  ) {
    return (
      candidate.unplacedCargoIds.length <
      currentBest.unplacedCargoIds.length
    )
  }

  const candidateVolume = getBoundsVolume(
    getArrangementBounds(
      candidate.arrangedCargo,
      cargoTemplatesById,
    ),
  )

  const currentBestVolume = getBoundsVolume(
    getArrangementBounds(
      currentBest.arrangedCargo,
      cargoTemplatesById,
    ),
  )

  return candidateVolume < currentBestVolume
}

function searchCargoArrangement({
  cargoIndex,
  cargoToArrange,
  arrangedCargo,
  cargoSpace,
  cargoTemplates,
  cargoTemplatesById,
  searchState,
}: {
  cargoIndex: number
  cargoToArrange: PlacedCargo[]
  arrangedCargo: PlacedCargo[]
  cargoSpace: CargoSpace
  cargoTemplates: CargoTemplate[]
  cargoTemplatesById: Map<string, CargoTemplate>
  searchState: ArrangementSearchState
}): ArrangementSearchResult {
  if (cargoIndex >= cargoToArrange.length) {
    return {
      arrangedCargo,
      unplacedCargoIds: [],
    }
  }

  if (searchState.visitedNodes >= MAX_SEARCH_NODES) {
    return {
      arrangedCargo,
      unplacedCargoIds: cargoToArrange
        .slice(cargoIndex)
        .map((cargo) => cargo.id),
    }
  }

  searchState.visitedNodes += 1

  const cargo = cargoToArrange[cargoIndex]
  const cargoTemplate = cargoTemplatesById.get(
    cargo.templateId,
  )

  if (!cargoTemplate) {
    const remainingResult = searchCargoArrangement({
      cargoIndex: cargoIndex + 1,
      cargoToArrange,
      arrangedCargo,
      cargoSpace,
      cargoTemplates,
      cargoTemplatesById,
      searchState,
    })

    return {
      arrangedCargo: remainingResult.arrangedCargo,
      unplacedCargoIds: [
        cargo.id,
        ...remainingResult.unplacedCargoIds,
      ],
    }
  }

  let bestResult: ArrangementSearchResult | null = null

  const orientationCandidates =
    getHorizontalOrientationCandidates(cargo)

  const currentBounds = getArrangementBounds(
    arrangedCargo,
    cargoTemplatesById,
  )

  const currentVolume = getBoundsVolume(
    currentBounds,
  )

  type PlacementCandidate = {
    orientation: CargoOrientation
    position: CargoPosition
    boundingBoxGrowth: number
  }

  const placementCandidates: PlacementCandidate[] =
    []

  orientationCandidates.forEach((orientation) => {
    const candidateCargo: PlacedCargo = {
      ...cargo,
      orientation,
      position: {
        xMm: 0,
        yMm: 0,
        zMm: 0,
      },
    }

    const candidateSize = getOrientedCargoSize(
      cargoTemplate,
      orientation,
    )

    const availablePositions =
      findAvailableCargoPositions({
        candidateCargo,
        cargoSpace,
        placedCargo: arrangedCargo,
        cargoTemplates,
      }).slice(0, MAX_POSITIONS_PER_ORIENTATION)

    availablePositions.forEach((position) => {
      const boundingBoxGrowth =
        getBoundsVolume(
          extendBounds(
            currentBounds,
            position,
            candidateSize,
          ),
        ) - currentVolume

      placementCandidates.push({
        orientation,
        position,
        boundingBoxGrowth,
      })
    })
  })

  placementCandidates.sort(
    (first, second) =>
      first.boundingBoxGrowth -
      second.boundingBoxGrowth,
  )

  for (const placementCandidate of placementCandidates) {
    const arrangedCandidate: PlacedCargo = {
      ...cargo,
      orientation: placementCandidate.orientation,
      position: placementCandidate.position,
    }

    const candidateResult =
      searchCargoArrangement({
        cargoIndex: cargoIndex + 1,
        cargoToArrange,
        arrangedCargo: [
          ...arrangedCargo,
          arrangedCandidate,
        ],
        cargoSpace,
        cargoTemplates,
        cargoTemplatesById,
        searchState,
      })

    if (
      candidateResult.unplacedCargoIds.length === 0
    ) {
      return candidateResult
    }

    if (
      isBetterSearchResult(
        candidateResult,
        bestResult,
        cargoTemplatesById,
      )
    ) {
      bestResult = candidateResult
    }

    if (
      searchState.visitedNodes >= MAX_SEARCH_NODES
    ) {
      break
    }
  }

  const skippedResult = searchCargoArrangement({
    cargoIndex: cargoIndex + 1,
    cargoToArrange,
    arrangedCargo,
    cargoSpace,
    cargoTemplates,
    cargoTemplatesById,
    searchState,
  })

  const resultWithSkippedCargo: ArrangementSearchResult = {
    arrangedCargo: skippedResult.arrangedCargo,
    unplacedCargoIds: [
      cargo.id,
      ...skippedResult.unplacedCargoIds,
    ],
  }

  if (
    isBetterSearchResult(
      resultWithSkippedCargo,
      bestResult,
      cargoTemplatesById,
    )
  ) {
    bestResult = resultWithSkippedCargo
  }

  return (
    bestResult ?? {
      arrangedCargo,
      unplacedCargoIds: cargoToArrange
        .slice(cargoIndex)
        .map((remainingCargo) => remainingCargo.id),
    }
  )
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

  const searchResult = searchCargoArrangement({
    cargoIndex: 0,
    cargoToArrange,
    arrangedCargo: fixedCargo,
    cargoSpace,
    cargoTemplates,
    cargoTemplatesById,
    searchState: {
      visitedNodes: 0,
    },
  })

  const cargoToArrangeById = new Map(
    cargoToArrange.map((cargo) => [cargo.id, cargo]),
  )

  const finalArrangedCargo = [
    ...searchResult.arrangedCargo,
  ]

  const unplacedCargoIds: string[] = []

  searchResult.unplacedCargoIds.forEach(
    (unplacedCargoId) => {
      const candidateCargo = cargoToArrangeById.get(
        unplacedCargoId,
      )

      const waitingZonePosition = candidateCargo
        ? findAvailableWaitingZonePosition({
            candidateCargo,
            cargoSpace,
            placedCargo: finalArrangedCargo,
            cargoTemplates,
          })
        : null

      if (!candidateCargo || !waitingZonePosition) {
        unplacedCargoIds.push(unplacedCargoId)

        return
      }

      finalArrangedCargo.push({
        ...candidateCargo,
        position: waitingZonePosition,
      })
    },
  )

  const arrangedCargoById = new Map(
    finalArrangedCargo.map((cargo) => [
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