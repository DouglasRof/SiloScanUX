import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { SiloDimensions, VolumeResult } from '../../types/silo'
import { buildGrainGeometry } from '../../lib/grainGeometry'

const GRAIN_COLOR = '#c9a15f'
const CONTOUR_COLOR = '#4a3218'
const RING_CONTOURS = 4
const SPOKE_CONTOURS = 10

export function GrainBody({ dims, volume }: { dims: SiloDimensions; volume: VolumeResult }) {
  const geometry = useMemo(() => buildGrainGeometry(dims, volume.heightGrid), [dims, volume.heightGrid])

  // This rebuilds on every tick (~2.2s, following volume.heightGrid), so leaving the
  // previous BufferGeometry's GPU buffers undisposed would leak steadily for as long as the
  // dashboard stays open — geometry passed through the `geometry` prop isn't auto-disposed
  // by R3F the way a JSX <bufferGeometry> child would be.
  useEffect(() => () => geometry.dispose(), [geometry])

  const ringPoints = useMemo(() => {
    const R = dims.diameterM / 2 + 0.03
    const y = Math.min(Math.max(volume.surfaceMeanHeightM, -dims.hopperHeightM * 0.98), dims.cylinderHeightM + dims.roofHeightM)
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2
      pts.push(new THREE.Vector3(R * Math.cos(a), y, R * Math.sin(a)))
    }
    return pts
  }, [dims, volume.surfaceMeanHeightM])

  // Traces the lidar heightmap itself (not flat circles) so the mound/funnel relief on top
  // of the grain reads clearly instead of relying on lighting alone.
  const surfaceContours = useMemo(() => {
    const grid = volume.heightGrid
    const maxHeight = dims.cylinderHeightM + Math.max(dims.roofHeightM, 0)
    const clip = (h: number) => Math.min(Math.max(h, 0), maxHeight) + 0.015
    const rings: THREE.Vector3[][] = []
    for (let k = 1; k <= RING_CONTOURS; k++) {
      const row = Math.min(grid.rings - 1, Math.floor((k / (RING_CONTOURS + 1)) * grid.rings))
      const radius = grid.ringRadii[row + 1]
      const pts: THREE.Vector3[] = []
      for (let col = 0; col <= grid.sectors; col++) {
        const c = col % grid.sectors
        const angle = grid.sectorAngles[c]
        pts.push(new THREE.Vector3(radius * Math.cos(angle), clip(grid.values[row][c]), radius * Math.sin(angle)))
      }
      rings.push(pts)
    }
    const spokes: THREE.Vector3[][] = []
    for (let s = 0; s < SPOKE_CONTOURS; s++) {
      const col = Math.floor((s / SPOKE_CONTOURS) * grid.sectors)
      const angle = grid.sectorAngles[col]
      const pts: THREE.Vector3[] = []
      for (let row = 0; row < grid.rings; row++) {
        const radius = grid.ringRadii[row + 1]
        pts.push(new THREE.Vector3(radius * Math.cos(angle), clip(grid.values[row][col]), radius * Math.sin(angle)))
      }
      spokes.push(pts)
    }
    return [...rings, ...spokes]
  }, [dims, volume.heightGrid])

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={GRAIN_COLOR} vertexColors roughness={0.92} metalness={0} />
      </mesh>
      {surfaceContours.map((pts, i) => (
        <Line key={i} points={pts} color={CONTOUR_COLOR} lineWidth={1.1} transparent opacity={0.4} />
      ))}
      <Line points={ringPoints} color="#5fd4e8" lineWidth={2} transparent opacity={0.85} />
    </group>
  )
}
