import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from '../../features/planner/model/types'
import {
  millimetersToSceneUnits,
  sceneUnitsToMillimeters,
} from '../../shared/lib/units'

export type ScenePosition = [number, number, number]

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(Math.max(value, minimum), maximum)
}

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

export function getClampedCargoPositionFromSceneCenter(
  cargoSpace: CargoSpace,
  cargoTemplate: CargoTemplate,
  centerX: number,
  centerZ: number,
): CargoPosition {
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

  const rawX = sceneUnitsToMillimeters(
    centerX +
      cargoSpaceLength / 2 -
      cargoLength / 2,
  )

  const rawZ = sceneUnitsToMillimeters(
    centerZ +
      cargoSpaceWidth / 2 -
      cargoWidth / 2,
  )

  const maximumX = Math.max(
    0,
    cargoSpace.lengthMm - cargoTemplate.lengthMm,
  )

  const maximumZ = Math.max(
    0,
    cargoSpace.widthMm - cargoTemplate.widthMm,
  )

  return {
    xMm: clamp(rawX, 0, maximumX),
    yMm: 0,
    zMm: clamp(rawZ, 0, maximumZ),
  }
}