const MILLIMETERS_IN_METER = 1000

export function millimetersToSceneUnits(valueMm: number): number {
  return valueMm / MILLIMETERS_IN_METER
}

export function sceneUnitsToMillimeters(value: number): number {
  return Math.round(value * MILLIMETERS_IN_METER)
}