import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  OrbitControls,
} from "@react-three/drei";
import { usePlannerStore } from "../../features/planner/store/usePlannerStore";
import { CargoMesh } from "./CargoMesh";
import { CargoSpace } from "./CargoSpace";
import { isCargoPositionAvailable } from "../../features/planner/lib/collision";
import type { CargoPosition } from "../../features/planner/model/types";
import { getSnappedCargoPosition } from "../../features/planner/lib/snapping";
import {
  getSupportedCargoPosition,
  isCargoSupportingAnotherCargo,
} from "../../features/planner/lib/support";
import {
  isWaitingZonePositionAvailable,
} from "@cargo-load-planner/packing-engine";

export function PlannerScene() {
  const [draggingCargoId, setDraggingCargoId] = useState<string | null>(null);

  const cargoSpace = usePlannerStore((state) => state.cargoSpace);

  const cargoTemplates = usePlannerStore((state) => state.cargoTemplates);

  const placedCargo = usePlannerStore((state) => state.placedCargo);

  const selectedCargoId = usePlannerStore((state) => state.selectedCargoId);

  const selectCargo = usePlannerStore((state) => state.selectCargo);

  const moveCargo = usePlannerStore((state) => state.moveCargo);

  const validateCargoPosition = useCallback(
  (cargoId: string, position: CargoPosition) => {
    const candidateCargo = placedCargo.find(
      (cargo) => cargo.id === cargoId,
    );

    if (!candidateCargo) {
      return false;
    }

    const availableInsideCargoSpace =
      isCargoPositionAvailable({
        cargoId,
        position,
        placedCargo,
        cargoTemplates,
        cargoSpace,
      });

    const availableInWaitingZone =
      isWaitingZonePositionAvailable({
        candidateCargo,
        position,
        cargoSpace,
        placedCargo,
        cargoTemplates,
      });

    return (
      availableInsideCargoSpace ||
      availableInWaitingZone
    );
  },
  [cargoSpace, cargoTemplates, placedCargo],
);

  const snapCargoPosition = useCallback(
    (cargoId: string, position: CargoPosition): CargoPosition => {
      if (position.xMm >= cargoSpace.lengthMm) {
  return {
    ...position,
    yMm: 0,
  };
}
      return getSnappedCargoPosition({
        cargoId,
        position,
        cargoSpace,
        placedCargo,
        cargoTemplates,
      });
    },
    [cargoSpace, cargoTemplates, placedCargo],
  );

  const supportCargoPosition = useCallback(
  (cargoId: string, position: CargoPosition): CargoPosition => {
    if (position.xMm >= cargoSpace.lengthMm) {
      return {
        ...position,
        yMm: 0,
      };
    }

    return getSupportedCargoPosition({
      cargoId,
      position,
      placedCargo,
      cargoTemplates,
    });
  },
  [cargoSpace, cargoTemplates, placedCargo],
);

  return (
    <Canvas
      shadows
      camera={{
        position: [11, 8, 11],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
      onPointerMissed={() => {
        if (draggingCargoId === null) {
          selectCargo(null);
        }
      }}
    >
      <color attach="background" args={["#111827"]} />

      <ambientLight intensity={0.65} />

      <directionalLight
        castShadow
        position={[6, 12, 8]}
        intensity={2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <Grid
        args={[30, 30]}
        position={[0, -0.081, 0]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#374151"
        sectionSize={2}
        sectionThickness={1.2}
        sectionColor="#6b7280"
        fadeDistance={35}
        fadeStrength={1}
        infiniteGrid
      />

      <CargoSpace cargoSpace={cargoSpace} />

      {placedCargo.map((cargo) => {
        const cargoTemplate = cargoTemplates.find(
          (template) => template.id === cargo.templateId,
        );

        if (!cargoTemplate) {
          return null;
        }

        const supportsAnotherCargo = isCargoSupportingAnotherCargo({
          cargoId: cargo.id,
          placedCargo,
          cargoTemplates,
        });

        return (
          <CargoMesh
            key={cargo.id}
            cargoSpace={cargoSpace}
            cargoTemplate={cargoTemplate}
            placedCargo={cargo}
            draggable={!supportsAnotherCargo}
            selected={cargo.id === selectedCargoId}
            onSelect={selectCargo}
            onMove={moveCargo}
            onDragStart={(cargoId) => {
              setDraggingCargoId(cargoId);
            }}
            onDragEnd={() => setDraggingCargoId(null)}
            isPositionValid={validateCargoPosition}
            getSnappedPosition={snapCargoPosition}
            getSupportedPosition={supportCargoPosition}
          />
        );
      })}

      <OrbitControls
        makeDefault
        enabled={draggingCargoId === null}
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1, 0]}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["#ef4444", "#22c55e", "#3b82f6"]}
          labelColor="#111827"
        />
      </GizmoHelper>
    </Canvas>
  );
}
