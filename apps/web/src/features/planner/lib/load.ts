import type {
  CargoOrientation,
  CargoPosition,
  CargoTemplate,
  PlacedCargo,
} from '../model/types'
import {
  getOrientedCargoSize,
  type OrientedCargoSize,
} from './orientation'

type StackValidationInput = {
  cargoId: string
  position: CargoPosition
  orientation?: CargoOrientation
  placedCargo: PlacedCargo[]
  cargoTemplates: CargoTemplate[]
}

type CargoNode = {
  cargo: PlacedCargo
  template: CargoTemplate
  size: OrientedCargoSize
}

export function isCargoStackValid({
  cargoId,
  position,
  orientation,
  placedCargo,
  cargoTemplates,
}: StackValidationInput): boolean {
  const movingCargo = placedCargo.find(
    (cargo) => cargo.id === cargoId,
  )

  if (!movingCargo) {
    return false
  }

  const candidateCargo: PlacedCargo = {
    ...movingCargo,
    position,
    orientation:
      orientation ?? movingCargo.orientation,
  }

  const candidatePlacedCargo = placedCargo.map(
    (cargo) =>
      cargo.id === cargoId
        ? candidateCargo
        : cargo,
  )

  const nodes: CargoNode[] = []

  for (const cargo of candidatePlacedCargo) {
    const template = cargoTemplates.find(
      (item) => item.id === cargo.templateId,
    )

    if (!template) {
      return false
    }

    nodes.push({
      cargo,
      template,
      size: getOrientedCargoSize(
        template,
        cargo.orientation,
      ),
    })
  }

  const nodesById = new Map(
    nodes.map((node) => [
      node.cargo.id,
      node,
    ]),
  )

  const childrenBySupportId = new Map<
    string,
    string[]
  >()

  for (const node of nodes) {
    if (node.cargo.position.yMm === 0) {
      continue
    }

    const support = nodes.find(
      (candidateSupport) => {
        if (
          candidateSupport.cargo.id ===
          node.cargo.id
        ) {
          return false
        }

        const supportTopY =
          candidateSupport.cargo.position.yMm +
          candidateSupport.size.yMm

        if (
          supportTopY !==
          node.cargo.position.yMm
        ) {
          return false
        }

        const fitsByX =
          node.cargo.position.xMm >=
            candidateSupport.cargo.position.xMm &&
          node.cargo.position.xMm +
            node.size.xMm <=
            candidateSupport.cargo.position.xMm +
              candidateSupport.size.xMm

        const fitsByZ =
          node.cargo.position.zMm >=
            candidateSupport.cargo.position.zMm &&
          node.cargo.position.zMm +
            node.size.zMm <=
            candidateSupport.cargo.position.zMm +
              candidateSupport.size.zMm

        return fitsByX && fitsByZ
      },
    )

    if (
      !support ||
      !support.template.stackable
    ) {
      return false
    }

    const currentChildren =
      childrenBySupportId.get(
        support.cargo.id,
      ) ?? []

    currentChildren.push(node.cargo.id)

    childrenBySupportId.set(
      support.cargo.id,
      currentChildren,
    )
  }

  const totalWeightCache =
    new Map<string, number>()

  const calculateTotalWeight = (
    currentCargoId: string,
    path: Set<string>,
  ): number => {
    const cachedWeight =
      totalWeightCache.get(currentCargoId)

    if (cachedWeight !== undefined) {
      return cachedWeight
    }

    if (path.has(currentCargoId)) {
      return Number.POSITIVE_INFINITY
    }

    const node = nodesById.get(currentCargoId)

    if (!node) {
      return Number.POSITIVE_INFINITY
    }

    const nextPath = new Set(path)
    nextPath.add(currentCargoId)

    const childIds =
      childrenBySupportId.get(
        currentCargoId,
      ) ?? []

    const childrenWeight = childIds.reduce(
      (total, childId) =>
        total +
        calculateTotalWeight(
          childId,
          nextPath,
        ),
      0,
    )

    const totalWeight =
      node.template.weightKg +
      childrenWeight

    totalWeightCache.set(
      currentCargoId,
      totalWeight,
    )

    return totalWeight
  }

  for (const node of nodes) {
    const childIds =
      childrenBySupportId.get(
        node.cargo.id,
      ) ?? []

    if (
      childIds.length > 0 &&
      !node.template.stackable
    ) {
      return false
    }

    const topLoadKg = childIds.reduce(
      (total, childId) =>
        total +
        calculateTotalWeight(
          childId,
          new Set(),
        ),
      0,
    )

    const maximumTopLoadKg =
      node.template.maxTopLoadKg

    if (
      maximumTopLoadKg !== null &&
      topLoadKg > maximumTopLoadKg
    ) {
      return false
    }
  }

  return true
}