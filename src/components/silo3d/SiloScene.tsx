import { useSiloStore } from '../../store/useSiloStore'
import { legClearanceM } from '../../lib/volume'
import { SiloModel } from './SiloModel'
import { GrainBody } from './GrainBody'
import { Annotations } from './Annotations'

// Flat-bottom silos have no legs (legClearanceM returns 0) but the shadow-catcher plane
// should still sit a hair below the hopper/base rather than exactly flush with it.
const SHADOW_PLANE_MIN_OFFSET_M = 0.11

export function SiloScene() {
  const dims = useSiloStore((s) => s.dims)
  const volume = useSiloStore((s) => s.volume)
  const groundY = -dims.hopperHeightM - Math.max(SHADOW_PLANE_MIN_OFFSET_M, legClearanceM(dims))

  return (
    <group>
      <SiloModel dims={dims} />
      <GrainBody dims={dims} volume={volume} />
      <Annotations dims={dims} volume={volume} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
        <circleGeometry args={[dims.diameterM * 1.8, 64]} />
        <shadowMaterial opacity={0.18} />
      </mesh>
    </group>
  )
}
