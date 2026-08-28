import { useMemo } from 'react'
import * as THREE from 'three'
import type { SiloDimensions } from '../../types/silo'
import { buildCorrugatedCylinderGeometry } from '../../lib/corrugated'
import { hopperOutletRadius } from '../../lib/volume'
import { GlassWallMaterial } from './GlassWallMaterial'

const PIPE_ANGLE = (3 * Math.PI) / 4

export function SiloModel({ dims }: { dims: SiloDimensions }) {
  const R = dims.diameterM / 2
  const r0 = hopperOutletRadius(dims)

  const wallGeometry = useMemo(
    () => buildCorrugatedCylinderGeometry(R, R, dims.cylinderHeightM, 128, Math.max(24, Math.round(R * 10)), 0.018),
    [R, dims.cylinderHeightM],
  )

  const roofGeometry = useMemo(() => new THREE.ConeGeometry(R * 1.01, dims.roofHeightM, 128), [R, dims.roofHeightM])
  const hopperGeometry = useMemo(
    () => buildCorrugatedCylinderGeometry(R, r0, dims.hopperHeightM, 128, Math.max(24, Math.round(R * 10)), 0.014),
    [R, r0, dims.hopperHeightM],
  )

  return (
    <group>
      <mesh geometry={wallGeometry} position={[0, dims.cylinderHeightM / 2, 0]}>
        <GlassWallMaterial />
      </mesh>

      <mesh geometry={roofGeometry} position={[0, dims.cylinderHeightM + dims.roofHeightM / 2, 0]} castShadow>
        <meshStandardMaterial color="#aeb6bd" metalness={0.7} roughness={0.32} />
      </mesh>

      <mesh position={[0, dims.cylinderHeightM + dims.roofHeightM + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.22, 24]} />
        <meshStandardMaterial color="#8f98a1" metalness={0.8} roughness={0.3} />
      </mesh>

      {dims.hopperHeightM > 0 && (
        <mesh geometry={hopperGeometry} position={[0, -dims.hopperHeightM / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#b7bec4" metalness={0.72} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      <group position={[R * Math.cos(PIPE_ANGLE), 0, R * Math.sin(PIPE_ANGLE)]}>
        <mesh position={[0, dims.cylinderHeightM * 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, dims.cylinderHeightM * 0.75, 16]} />
          <meshStandardMaterial color="#8f98a1" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.08, dims.cylinderHeightM * 0.92, 0]} rotation={[0, 0, Math.PI / 2.3]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.4, 16]} />
          <meshStandardMaterial color="#8f98a1" metalness={0.7} roughness={0.4} />
        </mesh>
      </group>

      <mesh position={[0, -dims.hopperHeightM - 0.05, 0]}>
        <cylinderGeometry args={[r0 * 1.15, r0 * 1.15, 0.1, 24]} />
        <meshStandardMaterial color="#6b7580" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}
