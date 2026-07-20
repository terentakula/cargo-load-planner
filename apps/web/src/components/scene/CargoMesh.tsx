import { useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import { Plane, Vector3 } from 'three'
import type {
  CargoPosition,
  CargoSpace,
  CargoTemplate,
  PlacedCargo,
} from '../../features/planner/model/types'
import { millimetersToSceneUnits } from '../../shared/lib/units'
import {
  getCargoScenePosition,
  getClampedCargoPositionFromSceneCenter,
} from './cargoCoordinates'

type Props = {
  cargoSpace: CargoSpace
  cargoTemplate: CargoTemplate
  placedCargo: PlacedCargo
  selected: boolean
  onSelect: (cargoId: string) => void
  onMove: (
    cargoId: string,
    position: CargoPosition,
  ) => void
  onDragStart: (cargoId: string) => void
  onDragEnd: () => void
  isPositionValid: (
    cargoId: string,
    position: CargoPosition,
  ) => boolean
}

type PointerCaptureTarget = EventTarget & {
  setPointerCapture: (pointerId: number) => void
  releasePointerCapture: (pointerId: number) => void
  hasPointerCapture?: (pointerId: number) => boolean
}

function isPointerCaptureTarget(
  target: EventTarget | null,
): target is PointerCaptureTarget {
  if (!target) {
    return false
  }

  const candidate = target as Partial<PointerCaptureTarget>

  return (
    typeof candidate.setPointerCapture === 'function' &&
    typeof candidate.releasePointerCapture === 'function'
  )
}

const FLOOR_PLANE = new Plane(
  new Vector3(0, 1, 0),
  0,
)

export function CargoMesh({
  cargoSpace,
  cargoTemplate,
  placedCargo,
  selected,
  onSelect,
  onMove,
  onDragStart,
  onDragEnd,
  isPositionValid,
}: Props) {
  const [previewPosition, setPreviewPosition] =
    useState<CargoPosition | null>(null)

  const [previewValid, setPreviewValid] =
    useState(true)

  const previewPositionRef =
    useRef<CargoPosition | null>(null)

  const previewValidRef = useRef(true)

  const activePointerId = useRef<number | null>(null)

  const pointerCaptureTarget =
    useRef<PointerCaptureTarget | null>(null)

  const floorIntersection = useRef(new Vector3())

  const dragOffset = useRef({
    x: 0,
    z: 0,
  })

  const length = millimetersToSceneUnits(
    cargoTemplate.lengthMm,
  )

  const width = millimetersToSceneUnits(
    cargoTemplate.widthMm,
  )

  const height = millimetersToSceneUnits(
    cargoTemplate.heightMm,
  )

  const renderedCargo = previewPosition
    ? {
        ...placedCargo,
        position: previewPosition,
      }
    : placedCargo

  const position = getCargoScenePosition(
    cargoSpace,
    cargoTemplate,
    renderedCargo,
  )

  const releaseCapturedPointer = (
    pointerId: number,
  ) => {
    const target = pointerCaptureTarget.current

    if (!target) {
      return
    }

    try {
      const canRelease =
        !target.hasPointerCapture ||
        target.hasPointerCapture(pointerId)

      if (canRelease) {
        target.releasePointerCapture(pointerId)
      }
    } finally {
      pointerCaptureTarget.current = null
    }
  }

  const resetDrag = () => {
    activePointerId.current = null
    previewPositionRef.current = null
    previewValidRef.current = true

    setPreviewPosition(null)
    setPreviewValid(true)

    document.body.style.cursor = ''

    onDragEnd()
  }

  const handlePointerDown = (
    event: ThreeEvent<PointerEvent>,
  ) => {
    if (event.button !== 0) {
      return
    }

    event.stopPropagation()
    onSelect(placedCargo.id)

    if (placedCargo.locked) {
      return
    }

    const intersection = event.ray.intersectPlane(
      FLOOR_PLANE,
      floorIntersection.current,
    )

    if (!intersection) {
      return
    }

    const captureTarget = event.target

    if (!isPointerCaptureTarget(captureTarget)) {
      return
    }

    const [currentX, , currentZ] =
      getCargoScenePosition(
        cargoSpace,
        cargoTemplate,
        placedCargo,
      )

    dragOffset.current = {
      x: currentX - intersection.x,
      z: currentZ - intersection.z,
    }

    activePointerId.current = event.pointerId
    pointerCaptureTarget.current = captureTarget

    captureTarget.setPointerCapture(event.pointerId)

    document.body.style.cursor = 'grabbing'

    onDragStart(placedCargo.id)
  }

  const handlePointerMove = (
    event: ThreeEvent<PointerEvent>,
  ) => {
    if (
      activePointerId.current !== event.pointerId ||
      placedCargo.locked
    ) {
      return
    }

    event.stopPropagation()

    const intersection = event.ray.intersectPlane(
      FLOOR_PLANE,
      floorIntersection.current,
    )

    if (!intersection) {
      return
    }

    const nextPosition =
      getClampedCargoPositionFromSceneCenter(
        cargoSpace,
        cargoTemplate,
        intersection.x + dragOffset.current.x,
        intersection.z + dragOffset.current.z,
      )

    const valid = isPositionValid(
      placedCargo.id,
      nextPosition,
    )

    previewPositionRef.current = nextPosition
    previewValidRef.current = valid

    setPreviewPosition(nextPosition)
    setPreviewValid(valid)

    document.body.style.cursor = valid
      ? 'grabbing'
      : 'not-allowed'
  }

  const handlePointerUp = (
    event: ThreeEvent<PointerEvent>,
  ) => {
    if (activePointerId.current !== event.pointerId) {
      return
    }

    event.stopPropagation()

    const nextPosition = previewPositionRef.current

    if (
      nextPosition &&
      previewValidRef.current
    ) {
      onMove(placedCargo.id, nextPosition)
    }

    releaseCapturedPointer(event.pointerId)
    resetDrag()
  }

  const handlePointerCancel = (
    event: ThreeEvent<PointerEvent>,
  ) => {
    if (activePointerId.current !== event.pointerId) {
      return
    }

    event.stopPropagation()

    releaseCapturedPointer(event.pointerId)
    resetDrag()
  }

  const dragging = previewPosition !== null
  const invalidPreview = dragging && !previewValid

  const displayedColor = invalidPreview
    ? '#ef4444'
    : cargoTemplate.color

  return (
    <mesh
      position={position}
      castShadow
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <boxGeometry args={[length, height, width]} />

      <meshStandardMaterial
        color={displayedColor}
        roughness={0.65}
        metalness={0.05}
        emissive={
          selected || dragging
            ? displayedColor
            : '#000000'
        }
        emissiveIntensity={
          invalidPreview
            ? 0.38
            : dragging
              ? 0.28
              : selected
                ? 0.18
                : 0
        }
        transparent={dragging}
        opacity={dragging ? 0.78 : 1}
      />

      <Edges
        color={
          invalidPreview
            ? '#ffffff'
            : dragging
              ? '#fef3c7'
              : selected
                ? '#ffffff'
                : '#111827'
        }
        threshold={15}
      />
    </mesh>
  )
}