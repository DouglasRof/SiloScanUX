import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { SiloDimensions, VolumeResult } from '../../types/silo'
import { buildGrainGeometry } from '../../lib/grainGeometry'

const GRAIN_COLOR = '#c9a15f'

export function GrainBody({ dims, volume }: { dims: SiloDimensions; volume: VolumeResult }) {
  const geometry = useMemo(() => buildGrainGeometry(dims, volume.heightGrid), [dims, volume.heightGrid])

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

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={GRAIN_COLOR} roughness={0.95} metalness={0} />
      </mesh>
      <Line points={ringPoints} color="#5fd4e8" lineWidth={2} transparent opacity={0.85} />
    </group>
  )
}
