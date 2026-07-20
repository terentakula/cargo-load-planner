import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from "../model/types";
import { getOrientedCargoSize } from "./orientation";

type SnapCargoPositionInput = {
  cargoId: string;
  position: CargoPosition;
  cargoSpace: CargoSpace;
  placedCargo: PlacedCargo[];
  cargoTemplates: CargoTemplate[];
  thresholdMm?: number;
};

const DEFAULT_SNAP_THRESHOLD_MM = 100;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function rangesOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

function findNearestCandidate(
  value: number,
  candidates: number[],
  thresholdMm: number,
): number {
  let nearestValue = value;
  let nearestDistance = thresholdMm + 1;

  candidates.forEach((candidate) => {
    const distance = Math.abs(value - candidate);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestValue = candidate;
    }
  });

  return nearestDistance <= thresholdMm ? nearestValue : value;
}

export function getSnappedCargoPosition({
  cargoId,
  position,
  cargoSpace,
  placedCargo,
  cargoTemplates,
  thresholdMm = DEFAULT_SNAP_THRESHOLD_MM,
}: SnapCargoPositionInput): CargoPosition {
  const movingCargo = placedCargo.find((cargo) => cargo.id === cargoId);

  if (!movingCargo) {
    return position;
  }

  const movingTemplate = cargoTemplates.find(
    (template) => template.id === movingCargo.templateId,
  );

  if (!movingTemplate) {
    return position;
  }

  const movingSize = getOrientedCargoSize(
    movingTemplate,
    movingCargo.orientation,
  );

  const maximumX = Math.max(0, cargoSpace.lengthMm - movingSize.xMm);

  const maximumZ = Math.max(0, cargoSpace.widthMm - movingSize.zMm);

  const xCandidates = [0, maximumX];
  const zCandidates = [0, maximumZ];

  placedCargo.forEach((otherCargo) => {
    if (otherCargo.id === cargoId) {
      return;
    }

    const otherTemplate = cargoTemplates.find(
      (template) => template.id === otherCargo.templateId,
    );

    if (!otherTemplate) {
      return;
    }

    const otherSize = getOrientedCargoSize(
      otherTemplate,
      otherCargo.orientation,
    );

    const movingMinX = position.xMm;
    const movingMaxX = position.xMm + movingSize.xMm;

    const movingMinZ = position.zMm;
    const movingMaxZ = position.zMm + movingSize.zMm;

    const otherMinX = otherCargo.position.xMm;
    const otherMaxX = otherCargo.position.xMm + otherSize.xMm;

    const otherMinZ = otherCargo.position.zMm;
    const otherMaxZ = otherCargo.position.zMm + otherSize.zMm;

    const overlapsByZ = rangesOverlap(
      movingMinZ,
      movingMaxZ,
      otherMinZ,
      otherMaxZ,
    );

    if (overlapsByZ) {
      xCandidates.push(clamp(otherMinX - movingSize.xMm, 0, maximumX));

      xCandidates.push(clamp(otherMaxX, 0, maximumX));
    }

    const overlapsByX = rangesOverlap(
      movingMinX,
      movingMaxX,
      otherMinX,
      otherMaxX,
    );

    if (overlapsByX) {
      zCandidates.push(clamp(otherMinZ - movingSize.zMm, 0, maximumZ));

      zCandidates.push(clamp(otherMaxZ, 0, maximumZ));
    }
  });

  return {
    xMm: findNearestCandidate(position.xMm, xCandidates, thresholdMm),
    yMm: position.yMm,
    zMm: findNearestCandidate(position.zMm, zCandidates, thresholdMm),
  };
}
