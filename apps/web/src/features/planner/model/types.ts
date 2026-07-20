export type CargoSpaceType = 'truck' | 'container' | 'van' | 'custom'

export type CargoSpace = {
  id: string
  name: string
  type: CargoSpaceType
  lengthMm: number
  widthMm: number
  heightMm: number
  maxWeightKg: number
}

export type CargoOrientation =
  | 'XYZ'
  | 'XZY'
  | 'YXZ'
  | 'YZX'
  | 'ZXY'
  | 'ZYX'

export type CargoTemplate = {
  id: string
  sku: string
  name: string
  lengthMm: number
  widthMm: number
  heightMm: number
  weightKg: number
  color: string
  canBeTilted: boolean
  stackable: boolean
  maxTopLoadKg: number | null
}

export type CargoPosition = {
  xMm: number
  yMm: number
  zMm: number
}

export type PlacedCargo = {
  id: string
  templateId: string
  position: CargoPosition
  orientation: CargoOrientation
  locked: boolean
}