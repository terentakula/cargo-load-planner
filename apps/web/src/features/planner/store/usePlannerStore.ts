import { create } from "zustand";
import {
  DEFAULT_CARGO_SPACE,
  DEFAULT_CARGO_TEMPLATES,
  DEFAULT_PLACED_CARGO,
} from "../model/defaults";
import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
  CargoOrientation,
} from "../model/types";

type PlannerState = {
  cargoSpace: CargoSpace;
  cargoTemplates: CargoTemplate[];
  placedCargo: PlacedCargo[];
  selectedCargoId: string | null;

  selectCargo: (cargoId: string | null) => void;
  moveCargo: (cargoId: string, position: CargoPosition) => void;
  rotateCargo: (cargoId: string, orientation: CargoOrientation) => void;
  toggleCargoLock: (cargoId: string) => void;
  duplicateCargo: (
    sourceCargoId: string,
    duplicateCargoId: string,
    position: CargoPosition,
  ) => void;
  removeCargo: (cargoId: string) => void;
};

export const usePlannerStore = create<PlannerState>((set) => ({
  cargoSpace: DEFAULT_CARGO_SPACE,
  cargoTemplates: DEFAULT_CARGO_TEMPLATES,
  placedCargo: DEFAULT_PLACED_CARGO,
  selectedCargoId: DEFAULT_PLACED_CARGO[0]?.id ?? null,

  selectCargo: (cargoId) => {
    set({
      selectedCargoId: cargoId,
    });
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
    }));
  },
  rotateCargo: (cargoId, orientation) => {
    set((state) => ({
      placedCargo: state.placedCargo.map((cargo) =>
        cargo.id === cargoId
          ? {
              ...cargo,
              orientation,
            }
          : cargo,
      ),
    }));
  },
  toggleCargoLock: (cargoId) => {
    set((state) => ({
      placedCargo: state.placedCargo.map((cargo) =>
        cargo.id === cargoId
          ? {
              ...cargo,
              locked: !cargo.locked,
            }
          : cargo,
      ),
    }));
  },
  duplicateCargo: (sourceCargoId, duplicateCargoId, position) => {
    set((state) => {
      const sourceCargo = state.placedCargo.find(
        (cargo) => cargo.id === sourceCargoId,
      );

      if (!sourceCargo) {
        return state;
      }

      return {
        placedCargo: [
          ...state.placedCargo,
          {
            ...sourceCargo,
            id: duplicateCargoId,
            position,
            locked: false,
          },
        ],
        selectedCargoId: duplicateCargoId,
      };
    });
  },
  removeCargo: (cargoId) => {
    set((state) => {
      const nextPlacedCargo = state.placedCargo.filter(
        (cargo) => cargo.id !== cargoId,
      );

      const nextSelectedCargoId =
        state.selectedCargoId === cargoId
          ? (nextPlacedCargo[0]?.id ?? null)
          : state.selectedCargoId;

      return {
        placedCargo: nextPlacedCargo,
        selectedCargoId: nextSelectedCargoId,
      };
    });
  },
}));
