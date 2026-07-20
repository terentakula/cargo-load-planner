import { Canvas } from '@react-three/fiber'
import {
  GizmoHelper,
  GizmoViewport,
  Grid,
  OrbitControls,
} from '@react-three/drei'
import { DEFAULT_CARGO_SPACE } from '../../features/planner/model/defaults'
import { CargoSpace } from './CargoSpace'

function TestCargo() {
  return (
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.6, 1, 1.2]} />

      <meshStandardMaterial
        color="#f59e0b"
        roughness={0.65}
        metalness={0.05}
      />
    </mesh>
  )
}

export function PlannerScene() {
  return (
    <Canvas
      shadows
      camera={{
        position: [11, 8, 11],
        fov: 45,
        near: 0.1,
        far: 200,
      }}
    >
      <color attach="background" args={['#111827']} />

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

      <CargoSpace cargoSpace={DEFAULT_CARGO_SPACE} />

      <TestCargo />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={4}
        maxDistance={45}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 1, 0]}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={['#ef4444', '#22c55e', '#3b82f6']}
          labelColor="#111827"
        />
      </GizmoHelper>
    </Canvas>
  )
}