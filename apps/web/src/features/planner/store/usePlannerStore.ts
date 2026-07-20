import { create } from 'zustand'
import {
  DEFAULT_CARGO_SPACE,
  DEFAULT_CARGO_TEMPLATES,
  DEFAULT_PLACED_CARGO,
} from '../model/defaults'
import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from '../model/types'

type PlannerState = {
  cargoSpace: CargoSpace
  cargoTemplates: CargoTemplate[]
  placedCargo: PlacedCargo[]
  selectedCargoId: string | null

  selectCargo: (cargoId: string | null) => void
  moveCargo: (
    cargoId: string,
    position: CargoPosition,
  ) => void
}

export const usePlannerStore = create<PlannerState>((set) => ({
  cargoSpace: DEFAULT_CARGO_SPACE,
  cargoTemplates: DEFAULT_CARGO_TEMPLATES,
  placedCargo: DEFAULT_PLACED_CARGO,
  selectedCargoId: DEFAULT_PLACED_CARGO[0]?.id ?? null,

  selectCargo: (cargoId) => {
    set({
      selectedCargoId: cargoId,
    })
  },

  moveCargo: (cargoId, position) => {
    set((state) => ({
      placedCargo: state.placedCargo.map((cargo) =>
        cargo.id === cargoId
          ? {
              ...cargo,
              position,
            }
          : cargo,
      ),
    }))
  },
}))