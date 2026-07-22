import { describe, expect, it } from "vitest";
import type { CargoSpace, CargoTemplate, PlacedCargo } from "./model/types";
import { arrangeCargoOnFloor } from "./autoPacking";
import { WAITING_ZONE_GAP_MM } from "./waitingZone";

const cargoSpace: CargoSpace = {
  id: "test-space",
  name: "Тестовый кузов",
  type: "truck",
  lengthMm: 3000,
  widthMm: 1000,
  heightMm: 2500,
  maxWeightKg: 10000,
};

const largeTemplate: CargoTemplate = {
  id: "template-large",
  sku: "LARGE",
  name: "Большой груз",
  lengthMm: 1200,
  widthMm: 1000,
  heightMm: 600,
  weightKg: 200,
  color: "#f59e0b",
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 500,
};

const smallTemplate: CargoTemplate = {
  id: "template-small",
  sku: "SMALL",
  name: "Маленький груз",
  lengthMm: 800,
  widthMm: 1000,
  heightMm: 400,
  weightKg: 100,
  color: "#22c55e",
  canBeTilted: true,
  stackable: true,
  maxTopLoadKg: 200,
};

const cargoTemplates = [largeTemplate, smallTemplate];

function createCargo(
  id: string,
  templateId: string,
  xMm: number,
  options?: {
    yMm?: number;
    zMm?: number;
    locked?: boolean;
  },
): PlacedCargo {
  return {
    id,
    templateId,
    position: {
      xMm,
      yMm: options?.yMm ?? 0,
      zMm: options?.zMm ?? 0,
    },
    orientation: "XYZ",
    locked: options?.locked ?? false,
  };
}

describe("arrangeCargoOnFloor", () => {
  it("размещает крупный груз раньше маленького", () => {
    const smallCargo = createCargo("cargo-small", smallTemplate.id, 2000);

    const largeCargo = createCargo("cargo-large", largeTemplate.id, 1000);

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [smallCargo, largeCargo],
      cargoTemplates,
    });

    const arrangedLargeCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-large",
    );

    const arrangedSmallCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-small",
    );

    expect(arrangedLargeCargo?.position).toEqual({
      xMm: 0,
      yMm: 0,
      zMm: 0,
    });

    expect(arrangedSmallCargo?.position).toEqual({
      xMm: 1200,
      yMm: 0,
      zMm: 0,
    });

    expect(result.unplacedCargoIds).toEqual([]);
  });

  it("не перемещает заблокированный груз", () => {
    const lockedCargo = createCargo("cargo-locked", smallTemplate.id, 1000, {
      locked: true,
    });

    const movableCargo = createCargo("cargo-movable", smallTemplate.id, 2000);

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [lockedCargo, movableCargo],
      cargoTemplates,
    });

    const arrangedLockedCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-locked",
    );

    expect(arrangedLockedCargo?.position).toEqual({
      xMm: 1000,
      yMm: 0,
      zMm: 0,
    });

    expect(arrangedLockedCargo?.locked).toBe(true);
  });

  it("не разрушает существующий штабель", () => {
    const baseCargo = createCargo("cargo-base", largeTemplate.id, 0);

    const upperCargo = createCargo("cargo-upper", smallTemplate.id, 200, {
      yMm: 600,
    });

    const movableCargo = createCargo("cargo-movable", smallTemplate.id, 2000);

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [baseCargo, upperCargo, movableCargo],
      cargoTemplates,
    });

    const arrangedBaseCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-base",
    );

    const arrangedUpperCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-upper",
    );

    expect(arrangedBaseCargo?.position).toEqual(baseCargo.position);

    expect(arrangedUpperCargo?.position).toEqual(upperCargo.position);
  });

  it("перемещает груз в зону ожидания, если в кузове не хватило места", () => {
    const narrowCargoSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 1500,
      heightMm: smallTemplate.heightMm,
    };

    const firstCargo = createCargo("cargo-a", smallTemplate.id, 0);

    const secondCargo = createCargo("cargo-b", smallTemplate.id, 700);

    const result = arrangeCargoOnFloor({
      cargoSpace: narrowCargoSpace,
      placedCargo: [firstCargo, secondCargo],
      cargoTemplates,
    });

    expect(result.unplacedCargoIds).toEqual([]);

    const waitingCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-b",
    );

    expect(waitingCargo?.position).toEqual({
      xMm: narrowCargoSpace.lengthMm + WAITING_ZONE_GAP_MM,
      yMm: 0,
      zMm: 0,
    });
  });

  it("оставляет груз неразмещённым, если он не помещается ни в кузове, ни в зоне ожидания", () => {
    const oversizedTemplate: CargoTemplate = {
      ...largeTemplate,
      id: "template-oversized",
      lengthMm: 3100,
      widthMm: 2100,
      heightMm: 400,
    };

    const oversizedCargo = createCargo(
      "cargo-oversized",
      oversizedTemplate.id,
      0,
    );

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [oversizedCargo],
      cargoTemplates: [oversizedTemplate],
    });

    expect(result.unplacedCargoIds).toEqual(["cargo-oversized"]);

    const unplacedCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-oversized",
    );

    expect(unplacedCargo?.position).toEqual(oversizedCargo.position);
  });

  it("сохраняет исходный порядок грузов в результате", () => {
    const smallCargo = createCargo("cargo-small", smallTemplate.id, 2000);

    const largeCargo = createCargo("cargo-large", largeTemplate.id, 1000);

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [smallCargo, largeCargo],
      cargoTemplates,
    });

    expect(result.placedCargo.map((cargo) => cargo.id)).toEqual([
      "cargo-small",
      "cargo-large",
    ]);
  });

  it("помечает груз без шаблона как неразмещённый", () => {
    const cargoWithoutTemplate = createCargo(
      "cargo-unknown",
      "missing-template",
      500,
    );

    const result = arrangeCargoOnFloor({
      cargoSpace,
      placedCargo: [cargoWithoutTemplate],
      cargoTemplates,
    });

    expect(result.unplacedCargoIds).toEqual(["cargo-unknown"]);

    expect(result.placedCargo[0].position).toEqual(
      cargoWithoutTemplate.position,
    );
  });

  it("поворачивает груз горизонтально, когда текущая ориентация не помещается", () => {
    const rotatedCargoSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 1000,
      widthMm: 1200,
      heightMm: 1000,
    };

    const rotatableTemplate: CargoTemplate = {
      ...largeTemplate,
      id: "template-rotatable",
      lengthMm: 1200,
      widthMm: 1000,
      heightMm: 600,
      canBeTilted: false,
    };

    const cargo = createCargo("cargo-rotatable", rotatableTemplate.id, 0);

    const result = arrangeCargoOnFloor({
      cargoSpace: rotatedCargoSpace,
      placedCargo: [cargo],
      cargoTemplates: [rotatableTemplate],
    });

    expect(result.unplacedCargoIds).toEqual([]);

    expect(result.placedCargo[0]).toMatchObject({
      orientation: "ZYX",
      position: {
        xMm: 0,
        yMm: 0,
        zMm: 0,
      },
    });
  });
  it("выбирает ориентацию, которая оставляет место для следующих грузов", () => {
    const compactCargoSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 1600,
      widthMm: 1200,
      heightMm: 1000,
    };

    const firstTemplate: CargoTemplate = {
      ...largeTemplate,
      id: "template-first",
      lengthMm: 1200,
      widthMm: 800,
      heightMm: 600,
      canBeTilted: false,
    };

    const secondTemplate: CargoTemplate = {
      ...smallTemplate,
      id: "template-second",
      lengthMm: 800,
      widthMm: 1200,
      heightMm: 600,
      canBeTilted: false,
    };

    const firstCargo = createCargo("cargo-a", firstTemplate.id, 0);

    const secondCargo = createCargo("cargo-b", secondTemplate.id, 0);

    const result = arrangeCargoOnFloor({
      cargoSpace: compactCargoSpace,
      placedCargo: [firstCargo, secondCargo],
      cargoTemplates: [firstTemplate, secondTemplate],
    });

    expect(result.unplacedCargoIds).toEqual([]);

    expect(result.placedCargo).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cargo-a",
          orientation: "ZYX",
          position: {
            xMm: 0,
            yMm: 0,
            zMm: 0,
          },
        }),
        expect.objectContaining({
          id: "cargo-b",
          orientation: "XYZ",
          position: {
            xMm: 800,
            yMm: 0,
            zMm: 0,
          },
        }),
      ]),
    );
  });
  it("размещает груз на втором уровне, когда пол занят", () => {
    const stackedCargoSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 1000,
      widthMm: 1000,
      heightMm: 1200,
    };

    const stackTemplate: CargoTemplate = {
      ...largeTemplate,
      id: "template-stack",
      lengthMm: 1000,
      widthMm: 1000,
      heightMm: 600,
      weightKg: 100,
      canBeTilted: false,
      stackable: true,
      maxTopLoadKg: 100,
    };

    const baseCargo = createCargo("cargo-a", stackTemplate.id, 0);

    const upperCargo = createCargo("cargo-b", stackTemplate.id, 2000);

    const result = arrangeCargoOnFloor({
      cargoSpace: stackedCargoSpace,
      placedCargo: [baseCargo, upperCargo],
      cargoTemplates: [stackTemplate],
    });

    expect(result.unplacedCargoIds).toEqual([]);

    expect(result.placedCargo).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "cargo-a",
          position: {
            xMm: 0,
            yMm: 0,
            zMm: 0,
          },
        }),
        expect.objectContaining({
          id: "cargo-b",
          position: {
            xMm: 0,
            yMm: 600,
            zMm: 0,
          },
        }),
      ]),
    );
  });

  it("предпочитает вариант с меньшим занимаемым объёмом продолжению по полу", () => {
    const roomyCargoSpace: CargoSpace = {
      ...cargoSpace,
      lengthMm: 3000,
      widthMm: 1000,
      heightMm: 1000,
    };

    const wideLowTemplate: CargoTemplate = {
      ...largeTemplate,
      id: "template-wide-low",
      lengthMm: 1000,
      widthMm: 1000,
      heightMm: 800,
      canBeTilted: false,
    };

    const narrowTemplate: CargoTemplate = {
      ...smallTemplate,
      id: "template-narrow",
      lengthMm: 1000,
      widthMm: 300,
      heightMm: 200,
      canBeTilted: false,
    };

    const baseCargo = createCargo("cargo-base", wideLowTemplate.id, 0, {
      locked: true,
    });

    const movableCargo = createCargo("cargo-movable", narrowTemplate.id, 1500);

    const result = arrangeCargoOnFloor({
      cargoSpace: roomyCargoSpace,
      placedCargo: [baseCargo, movableCargo],
      cargoTemplates: [wideLowTemplate, narrowTemplate],
    });

    expect(result.unplacedCargoIds).toEqual([]);

    const arrangedMovableCargo = result.placedCargo.find(
      (cargo) => cargo.id === "cargo-movable",
    );

    expect(arrangedMovableCargo?.position).toEqual({
      xMm: 0,
      yMm: wideLowTemplate.heightMm,
      zMm: 0,
    });
  });
});
