import type {
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from '../../features/planner/model/types'
import { millimetersToSceneUnits } from '../../shared/lib/units'

export type ScenePosition = [number, number, number]

export function getCargoScenePosition(
  cargoSpace: CargoSpace,
  cargoTemplate: CargoTemplate,
  placedCargo: PlacedCargo,
): ScenePosition {
  const cargoSpaceLength = millimetersToSceneUnits(
    cargoSpace.lengthMm,
  )

  const cargoSpaceWidth = millimetersToSceneUnits(
    cargoSpace.widthMm,
  )

  const cargoLength = millimetersToSceneUnits(
    cargoTemplate.lengthMm,
  )

  const cargoWidth = millimetersToSceneUnits(
    cargoTemplate.widthMm,
  )

  const cargoHeight = millimetersToSceneUnits(
    cargoTemplate.heightMm,
  )

  const x =
    -cargoSpaceLength / 2 +
    millimetersToSceneUnits(placedCargo.position.xMm) +
    cargoLength / 2

  const y =
    millimetersToSceneUnits(placedCargo.position.yMm) +
    cargoHeight / 2

  const z =
    -cargoSpaceWidth / 2 +
    millimetersToSceneUnits(placedCargo.position.zMm) +
    cargoWidth / 2

  return [x, y, z]
}