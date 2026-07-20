import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import type {
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from '../../features/planner/model/types'
import { millimetersToSceneUnits } from '../../shared/lib/units'
import { getCargoScenePosition } from './cargoCoordinates'

type Props = {
  cargoSpace: CargoSpace
  cargoTemplate: CargoTemplate
  placedCargo: PlacedCargo
  selected: boolean
  onSelect: (cargoId: string) => void
}

export function CargoMesh({
  cargoSpace,
  cargoTemplate,
  placedCargo,
  selected,
  onSelect,
}: Props) {
  const length = millimetersToSceneUnits(
    cargoTemplate.lengthMm,
  )

  const width = millimetersToSceneUnits(
    cargoTemplate.widthMm,
  )

  const height = millimetersToSceneUnits(
    cargoTemplate.heightMm,
  )

  const position = getCargoScenePosition(
    cargoSpace,
    cargoTemplate,
    placedCargo,
  )

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(placedCargo.id)
  }

  return (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onClick={handleClick}
    >
      <boxGeometry args={[length, height, width]} />

      <meshStandardMaterial
        color={cargoTemplate.color}
        roughness={0.65}
        metalness={0.05}
        emissive={selected ? cargoTemplate.color : '#000000'}
        emissiveIntensity={selected ? 0.18 : 0}
      />

      <Edges
        color={selected ? '#ffffff' : '#111827'}
        threshold={15}
      />
    </mesh>
  )
}