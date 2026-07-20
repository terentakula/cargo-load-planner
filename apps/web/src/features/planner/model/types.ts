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