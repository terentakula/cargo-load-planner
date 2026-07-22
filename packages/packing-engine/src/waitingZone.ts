import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from "./model/types";
import { getOrientedCargoSize } from "./orientation";

export const WAITING_ZONE_GAP_MM = 500;

export const WAITING_ZONE_WIDTH_MULTIPLIER = 2;

export type WaitingZonePositionInput = {
  candidateCargo: PlacedCargo;
  position: CargoPosition;
  cargoSpace: CargoSpace;
  placedCargo: PlacedCargo[];
  cargoTemplates: CargoTemplate[];
};

export type FindWaitingZonePositionInput = {
  candidateCargo: PlacedCargo;
  cargoSpace: CargoSpace;
  placedCargo: PlacedCargo[];
  cargoTemplates: CargoTemplate[];
};

function rangesOverlap(
  firstStart: number,
  firstEnd: number,
  secondStart: number,
  secondEnd: number,
): boolean {
  return firstStart < secondEnd && firstEnd > secondStart;
}

function isCargoInWaitingZone(
  cargo: PlacedCargo,
  cargoTemplate: CargoTemplate,
  cargoSpace: CargoSpace,
): boolean {
  const cargoSize = getOrientedCargoSize(cargoTemplate, cargo.orientation);

  const waitingZoneStartX = cargoSpace.lengthMm + WAITING_ZONE_GAP_MM;

  const waitingZoneEndX = waitingZoneStartX + cargoSpace.lengthMm;

  const additionalWidthMm =
    cargoSpace.widthMm * (WAITING_ZONE_WIDTH_MULTIPLIER - 1);

  const waitingZoneMinimumZ = -additionalWidthMm / 2;

  const waitingZoneMaximumZ = cargoSpace.widthMm + additionalWidthMm / 2;

  return (
    cargo.position.yMm === 0 &&
    cargo.position.xMm >= waitingZoneStartX &&
    cargo.position.xMm + cargoSize.xMm <= waitingZoneEndX &&
    cargo.position.zMm >= waitingZoneMinimumZ &&
    cargo.position.zMm + cargoSize.zMm <= waitingZoneMaximumZ
  );
}

export function isWaitingZonePositionAvailable({
  candidateCargo,
  position,
  cargoSpace,
  placedCargo,
  cargoTemplates,
}: WaitingZonePositionInput): boolean {
  const candidateTemplate = cargoTemplates.find(
    (template) => template.id === candidateCargo.templateId,
  );

  if (!candidateTemplate) {
    return false;
  }

  const positionedCandidate: PlacedCargo = {
    ...candidateCargo,
    position,
  };

  if (
    !isCargoInWaitingZone(positionedCandidate, candidateTemplate, cargoSpace)
  ) {
    return false;
  }

  const candidateSize = getOrientedCargoSize(
    candidateTemplate,
    positionedCandidate.orientation,
  );

  const candidateMinX = position.xMm;
  const candidateMaxX = candidateMinX + candidateSize.xMm;

  const candidateMinY = position.yMm;
  const candidateMaxY = candidateMinY + candidateSize.yMm;

  const candidateMinZ = position.zMm;
  const candidateMaxZ = candidateMinZ + candidateSize.zMm;

  return placedCargo.every((otherCargo) => {
    if (otherCargo.id === candidateCargo.id) {
      return true;
    }

    const otherTemplate = cargoTemplates.find(
      (template) => template.id === otherCargo.templateId,
    );

    if (!otherTemplate) {
      return true;
    }

    const otherSize = getOrientedCargoSize(
      otherTemplate,
      otherCargo.orientation,
    );

    const otherMinX = otherCargo.position.xMm;
    const otherMaxX = otherMinX + otherSize.xMm;

    const otherMinY = otherCargo.position.yMm;
    const otherMaxY = otherMinY + otherSize.yMm;

    const otherMinZ = otherCargo.position.zMm;
    const otherMaxZ = otherMinZ + otherSize.zMm;

    const overlapsByX = rangesOverlap(
      candidateMinX,
      candidateMaxX,
      otherMinX,
      otherMaxX,
    );

    const overlapsByY = rangesOverlap(
      candidateMinY,
      candidateMaxY,
      otherMinY,
      otherMaxY,
    );

    const overlapsByZ = rangesOverlap(
      candidateMinZ,
      candidateMaxZ,
      otherMinZ,
      otherMaxZ,
    );

    return !(overlapsByX && overlapsByY && overlapsByZ);
  });
}

export function findAvailableWaitingZonePosition({
  candidateCargo,
  cargoSpace,
  placedCargo,
  cargoTemplates,
}: FindWaitingZonePositionInput): CargoPosition | null {
  const waitingZoneStartX = cargoSpace.lengthMm + WAITING_ZONE_GAP_MM;

  const additionalWidthMm =
    cargoSpace.widthMm * (WAITING_ZONE_WIDTH_MULTIPLIER - 1);

  const waitingZoneMinimumZ = -additionalWidthMm / 2;

  const xCandidates = [waitingZoneStartX];
  const zCandidates = [0, waitingZoneMinimumZ];

  placedCargo.forEach((otherCargo) => {
    const otherTemplate = cargoTemplates.find(
      (template) => template.id === otherCargo.templateId,
    );

    if (!otherTemplate) {
      return;
    }

    if (!isCargoInWaitingZone(otherCargo, otherTemplate, cargoSpace)) {
      return;
    }

    const otherSize = getOrientedCargoSize(
      otherTemplate,
      otherCargo.orientation,
    );

    xCandidates.push(otherCargo.position.xMm + otherSize.xMm);

    zCandidates.push(otherCargo.position.zMm + otherSize.zMm);
  });

  const positions = xCandidates.flatMap((xMm) =>
    zCandidates.map((zMm) => ({
      xMm,
      yMm: 0,
      zMm,
    })),
  );

  positions.sort((firstPosition, secondPosition) => {
    if (firstPosition.xMm !== secondPosition.xMm) {
      return firstPosition.xMm - secondPosition.xMm;
    }

    const firstDistanceFromCenter = Math.abs(firstPosition.zMm);

    const secondDistanceFromCenter = Math.abs(secondPosition.zMm);

    if (firstDistanceFromCenter !== secondDistanceFromCenter) {
      return firstDistanceFromCenter - secondDistanceFromCenter;
    }

    return firstPosition.zMm - secondPosition.zMm;
  });

  return (
    positions.find((position) =>
      isWaitingZonePositionAvailable({
        candidateCargo,
        position,
        cargoSpace,
        placedCargo,
        cargoTemplates,
      }),
    ) ?? null
  );
}
