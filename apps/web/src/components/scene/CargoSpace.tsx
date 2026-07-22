import { Edges } from "@react-three/drei";
import { DoubleSide } from "three";
import type { CargoSpace as CargoSpaceModel } from "../../features/planner/model/types";
import { millimetersToSceneUnits } from "../../shared/lib/units";
import {
  WAITING_ZONE_GAP_MM,
  WAITING_ZONE_WIDTH_MULTIPLIER,
} from "@cargo-load-planner/packing-engine";

type Props = {
  cargoSpace: CargoSpaceModel;
};

const WALL_THICKNESS = 0.06;
const FLOOR_THICKNESS = 0.08;

function SpaceWall({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />

      <meshStandardMaterial
        color="#38bdf8"
        transparent
        opacity={0.12}
        roughness={0.7}
        metalness={0.05}
        side={DoubleSide}
        depthWrite={false}
      />

      <Edges color="#38bdf8" />
    </mesh>
  );
}

export function CargoSpace({ cargoSpace }: Props) {
  const length = millimetersToSceneUnits(cargoSpace.lengthMm);
  const width = millimetersToSceneUnits(cargoSpace.widthMm);
  const height = millimetersToSceneUnits(cargoSpace.heightMm);

  const waitingZoneGap = millimetersToSceneUnits(WAITING_ZONE_GAP_MM);

  const waitingZoneLength = length;

  const waitingZoneWidth = width * WAITING_ZONE_WIDTH_MULTIPLIER;

  const waitingZoneCenterZ = 0

  const waitingZoneCenterX = length + waitingZoneGap;

  const halfLength = length / 2;
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  return (
    <group>
      <mesh position={[0, -FLOOR_THICKNESS / 2, 0]} receiveShadow>
        <boxGeometry args={[length, FLOOR_THICKNESS, width]} />

        <meshStandardMaterial
          color="#334155"
          roughness={0.9}
          metalness={0.05}
        />

        <Edges color="#64748b" />
      </mesh>

      <mesh
        position={[
          waitingZoneCenterX,
          -FLOOR_THICKNESS / 2,
          waitingZoneCenterZ,
        ]}
        receiveShadow
      >
        <boxGeometry
          args={[waitingZoneLength, FLOOR_THICKNESS, waitingZoneWidth]}
        />

        <meshStandardMaterial
          color="#78350f"
          transparent
          opacity={0.42}
          roughness={0.9}
          metalness={0.02}
        />

        <Edges color="#f59e0b" />
      </mesh>

      <SpaceWall
        position={[0, halfHeight, -halfWidth - WALL_THICKNESS / 2]}
        size={[length, height, WALL_THICKNESS]}
      />

      <SpaceWall
        position={[0, halfHeight, halfWidth + WALL_THICKNESS / 2]}
        size={[length, height, WALL_THICKNESS]}
      />

      <SpaceWall
        position={[-halfLength - WALL_THICKNESS / 2, halfHeight, 0]}
        size={[WALL_THICKNESS, height, width + WALL_THICKNESS * 2]}
      />
    </group>
  );
}
