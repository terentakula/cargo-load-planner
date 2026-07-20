export type CargoFormValues = {
  name: string
  sku: string
  lengthMm: string
  widthMm: string
  heightMm: string
  weightKg: string
  color: string
  canBeTilted: boolean
  stackable: boolean
  maxTopLoadKg: string
}

export const INITIAL_CARGO_FORM_VALUES: CargoFormValues = {
  name: '',
  sku: '',
  lengthMm: '',
  widthMm: '',
  heightMm: '',
  weightKg: '',
  color: '#f59e0b',
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: '',
}