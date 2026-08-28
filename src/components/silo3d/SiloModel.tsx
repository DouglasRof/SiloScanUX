import { useMemo } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import type { SiloDimensions } from '../../types/silo'
import { buildCorrugatedCylinderGeometry } from '../../lib/corrugated'
import { hopperOutletRadius, legClearanceM } from '../../lib/volume'
import { GlassWallMaterial } from './GlassWallMaterial'

const PIPE_ANGLE = (3 * Math.PI) / 4
const LEG_COUNT = 4
const UP = new THREE.Vector3(0, 1, 0)

interface Leg {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  length: number
  footPosition: THREE.Vector3
  bracePoint: THREE.Vector3
}

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

  const legRadius = Math.max(0.025, R * 0.016)
  const legs = useMemo<Leg[]>(() => {
    const clearance = legClearanceM(dims)
    if (clearance <= 0) return []
    const topY = -dims.hopperHeightM * 0.15
    const topR = R * 0.82
    const groundY = -dims.hopperHeightM - clearance
    const bottomR = R * 1.3
    return Array.from({ length: LEG_COUNT }, (_, i) => {
      const angle = (i / LEG_COUNT) * Math.PI * 2 + Math.PI / LEG_COUNT
      const top = new THREE.Vector3(topR * Math.cos(angle), topY, topR * Math.sin(angle))
      const bottom = new THREE.Vector3(bottomR * Math.cos(angle), groundY, bottomR * Math.sin(angle))
      const position = top.clone().add(bottom).multiplyScalar(0.5)
      const direction = bottom.clone().sub(top).normalize()
      return {
        position,
        quaternion: new THREE.Quaternion().setFromUnitVectors(UP, direction),
        length: top.distanceTo(bottom),
        footPosition: bottom,
        bracePoint: top.clone().lerp(bottom, 0.55),
      }
    })
  }, [dims, R])

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

      {legs.map((leg, i) => (
        <group key={i}>
          <mesh position={leg.position} quaternion={leg.quaternion} castShadow>
            <cylinderGeometry args={[legRadius, legRadius, leg.length, 10]} />
            <meshStandardMaterial color="#6b7580" metalness={0.7} roughness={0.45} />
          </mesh>
          <mesh position={leg.footPosition} castShadow>
            <cylinderGeometry args={[legRadius * 2.8, legRadius * 3.2, legRadius * 1.6, 12]} />
            <meshStandardMaterial color="#565f68" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {legs.length > 1 &&
        legs.map((leg, i) => (
          <Line
            key={`brace-${i}`}
            points={[leg.bracePoint, legs[(i + 1) % legs.length].bracePoint]}
            color="#6b7580"
            lineWidth={1.4}
          />
        ))}
    </group>
  )
}
